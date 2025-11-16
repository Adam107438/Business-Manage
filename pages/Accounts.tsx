
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Account, AccountTransfer, CashFlow, ActionToProtect, ItemType } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, Edit, Trash2, ArrowRightLeft, ArrowDown, ArrowUp } from 'lucide-react';

const Accounts: React.FC = () => {
    const { state, addItem, updateItem, deleteItem, addAccountTransfer, updateAccountTransfer, deleteAccountTransfer, addCashFlow, updateCashFlow, deleteCashFlow } = useData();
    const { accounts, accountTransfers, cashFlows } = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
    const [accountName, setAccountName] = useState('');
    const [initialBalance, setInitialBalance] = useState(0);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [currentTransfer, setCurrentTransfer] = useState<AccountTransfer | null>(null);
    const initialTransferState = { fromAccountId: '', toAccountId: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' };
    const [transferForm, setTransferForm] = useState<Omit<AccountTransfer, 'id'>>(initialTransferState);

    const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
    const [currentCashFlow, setCurrentCashFlow] = useState<CashFlow | null>(null);
    const initialCashFlowState: Omit<CashFlow, 'id'> = { type: 'deposit', accountId: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' };
    const [cashFlowForm, setCashFlowForm] = useState<Omit<CashFlow, 'id'>>(initialCashFlowState);

    const [isPasswordProtectOpen, setIsPasswordProtectOpen] = useState(false);
    const [actionToProtect, setActionToProtect] = useState<ActionToProtect>(null);

    const handleOpenModal = (account: Account | null = null) => {
        setCurrentAccount(account);
        setAccountName(account ? account.name : '');
        setInitialBalance(account ? account.balance : 0);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentAccount(null);
        setAccountName('');
        setInitialBalance(0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentAccount) {
            await updateItem('accounts', { ...currentAccount, name: accountName });
        } else {
            const payload: Account = {
                id: `acc_${Date.now()}`,
                name: accountName,
                balance: initialBalance,
            };
            await addItem('accounts', payload);
        }
        handleCloseModal();
    };

    const handleDelete = (account: Account) => {
        setActionToProtect({ type: 'delete', itemType: 'account' as ItemType, payload: account });
        setIsPasswordProtectOpen(true);
    };

    const handleOpenTransferModal = (transfer: AccountTransfer | null = null) => {
        setCurrentTransfer(transfer);
        setTransferForm(transfer ? { fromAccountId: transfer.fromAccountId, toAccountId: transfer.toAccountId, amount: transfer.amount, date: transfer.date, description: transfer.description } : initialTransferState);
        setIsTransferModalOpen(true);
    };

    const handleCloseTransferModal = () => {
        setIsTransferModalOpen(false);
        setCurrentTransfer(null);
    };

    const handleTransferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTransferForm(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (transferForm.fromAccountId === transferForm.toAccountId) {
            alert("From and To accounts cannot be the same.");
            return;
        }
        if (transferForm.amount <= 0) {
            alert("Transfer amount must be positive.");
            return;
        }

        if (currentTransfer) {
            await updateAccountTransfer(currentTransfer, { ...transferForm, id: currentTransfer.id });
        } else {
            await addAccountTransfer({ ...transferForm, id: `xfer_${Date.now()}` });
        }
        handleCloseTransferModal();
    };
    
    const handleTransferDelete = (transfer: AccountTransfer) => {
        setActionToProtect({ type: 'delete', itemType: 'accountTransfer' as ItemType, payload: transfer });
        setIsPasswordProtectOpen(true);
    }

    const handleOpenCashFlowModal = (type: 'deposit' | 'withdrawal', cashFlow: CashFlow | null = null) => {
        setCurrentCashFlow(cashFlow);
        if (cashFlow) {
            setCashFlowForm({ type: cashFlow.type, accountId: cashFlow.accountId, amount: cashFlow.amount, date: cashFlow.date, description: cashFlow.description });
        } else {
            setCashFlowForm({ ...initialCashFlowState, type: type, accountId: accounts.length > 0 ? accounts[0].id : '' });
        }
        setIsCashFlowModalOpen(true);
    };
    
    const handleCloseCashFlowModal = () => {
        setIsCashFlowModalOpen(false);
        setCurrentCashFlow(null);
    };

    const handleCashFlowFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCashFlowForm(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };
    
    const handleCashFlowSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cashFlowForm.amount <= 0) {
            alert("Amount must be positive.");
            return;
        }

        if (currentCashFlow) {
            await updateCashFlow(currentCashFlow, { ...cashFlowForm, id: currentCashFlow.id });
        } else {
            await addCashFlow({ ...cashFlowForm, id: `cf_${Date.now()}` });
        }
        handleCloseCashFlowModal();
    };
    
    const handleCashFlowDelete = (cashFlow: CashFlow) => {
        setActionToProtect({ type: 'delete', itemType: 'cashFlow' as ItemType, payload: cashFlow });
        setIsPasswordProtectOpen(true);
    };

    const confirmDelete = async () => {
        if (!actionToProtect || !actionToProtect.payload) return;
        
        const { type, itemType, payload } = actionToProtect;

        if (type === 'delete') {
            if (itemType === 'account') {
                await deleteItem('accounts', payload.id);
            } else if (itemType === 'accountTransfer') {
                await deleteAccountTransfer(payload as AccountTransfer);
            } else if (itemType === 'cashFlow') {
                await deleteCashFlow(payload as CashFlow);
            }
        }
    };

    const getAccountNameById = (id: string) => accounts.find(a => a.id === id)?.name || 'N/A';
    
    return (
        <div className="space-y-8">
            <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Business Accounts</h2>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleOpenCashFlowModal('deposit')} variant="secondary" className="!bg-green-600 hover:!bg-green-500">
                            <ArrowDown className="w-5 h-5 mr-2 inline" /> Deposit
                        </Button>
                        <Button onClick={() => handleOpenCashFlowModal('withdrawal')} variant="secondary" className="!bg-yellow-600 hover:!bg-yellow-500">
                            <ArrowUp className="w-5 h-5 mr-2 inline" /> Withdraw
                        </Button>
                        <Button onClick={() => handleOpenTransferModal()} variant="secondary">
                            <ArrowRightLeft className="w-5 h-5 mr-2 inline" /> Transfer
                        </Button>
                        <Button onClick={() => handleOpenModal()}>
                            <Plus className="w-5 h-5 mr-2 inline" /> Add Account
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {accounts.map(account => (
                                    <tr key={account.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{account.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">৳{account.balance.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(account)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-4"><Edit size={18}/></button>
                                            <button onClick={() => handleDelete(account)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Deposit & Withdrawal History</h2>
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Account</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {cashFlows.map(cf => (
                                    <tr key={cf.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(cf.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${cf.type === 'deposit' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                                {cf.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getAccountNameById(cf.accountId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">৳{cf.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{cf.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenCashFlowModal(cf.type, cf)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                            <button onClick={() => handleCashFlowDelete(cf)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Balance Transfer History</h2>
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">From</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">To</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {accountTransfers.map(t => (
                                     <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getAccountNameById(t.fromAccountId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getAccountNameById(t.toAccountId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">৳{t.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{t.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenTransferModal(t)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                            <button onClick={() => handleTransferDelete(t)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentAccount ? 'Edit Account' : 'Add Account'}>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Account Name</label>
                        <input type="text" id="accountName" value={accountName} onChange={e => setAccountName(e.target.value)} required
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Balance</label>
                        <input type="number" id="initialBalance" value={initialBalance} onChange={e => setInitialBalance(parseFloat(e.target.value))} required
                         disabled={!!currentAccount}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-600"/>
                             {currentAccount && <p className="text-xs text-gray-500 mt-1">Balance cannot be edited directly. It changes with transactions.</p>}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit">{currentAccount ? 'Update' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isTransferModalOpen} onClose={handleCloseTransferModal} title={currentTransfer ? 'Edit Transfer' : 'New Balance Transfer'}>
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium">From Account</label>
                             <select name="fromAccountId" value={transferForm.fromAccountId} onChange={handleTransferFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                 <option value="">Select Account</option>
                                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                             </select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium">To Account</label>
                             <select name="toAccountId" value={transferForm.toAccountId} onChange={handleTransferFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                 <option value="">Select Account</option>
                                  {accounts.filter(a => a.id !== transferForm.fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" name="amount" value={transferForm.amount} onChange={handleTransferFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" name="date" value={transferForm.date} onChange={handleTransferFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Description (Optional)</label>
                        <input type="text" name="description" value={transferForm.description} onChange={handleTransferFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseTransferModal}>Cancel</Button>
                        <Button type="submit">{currentTransfer ? 'Update' : 'Confirm Transfer'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal 
                isOpen={isCashFlowModalOpen} 
                onClose={handleCloseCashFlowModal} 
                title={`${currentCashFlow ? 'Edit' : 'New'} ${cashFlowForm.type.charAt(0).toUpperCase() + cashFlowForm.type.slice(1)}`}
            >
                <form onSubmit={handleCashFlowSubmit} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium">Account</label>
                         <select name="accountId" value={cashFlowForm.accountId} onChange={handleCashFlowFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                             <option value="">Select Account</option>
                             {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                         </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" name="amount" value={cashFlowForm.amount} onChange={handleCashFlowFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required min="0.01" step="0.01"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" name="date" value={cashFlowForm.date} onChange={handleCashFlowFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Description (Optional)</label>
                        <input type="text" name="description" value={cashFlowForm.description} onChange={handleCashFlowFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                     <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseCashFlowModal}>Cancel</Button>
                        <Button type="submit">{currentCashFlow ? 'Update' : `Confirm ${cashFlowForm.type}`}</Button>
                    </div>
                </form>
            </Modal>

            <PasswordProtect 
                isOpen={isPasswordProtectOpen}
                onClose={() => setIsPasswordProtectOpen(false)}
                onSuccess={confirmDelete}
                actionName={`delete this ${actionToProtect?.itemType}`}
            />
        </div>
    );
};

export default Accounts;