
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Partner, Investment, ActionToProtect, ItemType } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';

const Partners = () => {
    const { state, addItem, updateItem, deleteItem, addInvestment } = useData();
    const { partners, investments, accounts } = state;
    const [partnerModalOpen, setPartnerModalOpen] = useState(false);
    const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
    const [formState, setFormState] = useState({ name: '', contact: '' });
    const [investmentState, setInvestmentState] = useState({ partnerId: '', accountId: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    
    // Partner Modal
    const handleOpenPartnerModal = (partner: Partner | null = null) => {
        setCurrentPartner(partner);
        setFormState(partner ? { name: partner.name, contact: partner.contact } : { name: '', contact: '' });
        setPartnerModalOpen(true);
    };

    const handleClosePartnerModal = () => {
        setPartnerModalOpen(false);
        setCurrentPartner(null);
    };

    const handlePartnerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPartner) {
            await updateItem('partners', { id: currentPartner.id, ...formState });
        } else {
            const payload: Partner = {
                id: `partner_${Date.now()}`,
                ...formState,
            };
            await addItem('partners', payload);
        }
        handleClosePartnerModal();
    };

    // Investment Modal
    const handleOpenInvestmentModal = () => {
        setInvestmentState({ partnerId: partners.length > 0 ? partners[0].id : '', accountId: accounts.length > 0 ? accounts[0].id : '', amount: 0, date: new Date().toISOString().split('T')[0] });
        setInvestmentModalOpen(true);
    };

    const handleInvestmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Investment = {
            id: `inv_${Date.now()}`,
            ...investmentState,
        };
        await addInvestment(payload);
        setInvestmentModalOpen(false);
    };

    const getPartnerName = (id: string) => partners.find(p => p.id === id)?.name || 'N/A';
    const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'N/A';

    return (
        <div className="space-y-8">
            {/* Partners Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Partners</h2>
                <Button onClick={() => handleOpenPartnerModal()}>
                    <Plus className="w-5 h-5 mr-2 inline" /> Add Partner
                </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                           <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contact</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {partners.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.contact}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {/* Actions hidden to ensure data integrity. Edit/Delete handled through specific transaction reversals if needed. */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Investments Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Partner Investments</h2>
                <Button onClick={handleOpenInvestmentModal}>
                    <Briefcase className="w-5 h-5 mr-2 inline" /> Add Investment
                </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="bg-gray-50 dark:bg-gray-700">
                           <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Partner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Account</th>
                           </tr>
                         </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {investments.map(inv => (
                                <tr key={inv.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{getPartnerName(inv.partnerId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">৳{inv.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getAccountName(inv.accountId)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Partner Modal */}
            <Modal isOpen={partnerModalOpen} onClose={handleClosePartnerModal} title={currentPartner ? 'Edit Partner' : 'Add Partner'}>
                <form onSubmit={handlePartnerSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Name</label>
                        <input type="text" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Contact</label>
                        <input type="text" value={formState.contact} onChange={e => setFormState({...formState, contact: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={handleClosePartnerModal}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>
            
            {/* Investment Modal */}
            <Modal isOpen={investmentModalOpen} onClose={() => setInvestmentModalOpen(false)} title="Add Investment">
                <form onSubmit={handleInvestmentSubmit} className="space-y-4">
                   <div className="mb-4">
                        <label className="block text-sm font-medium">Partner</label>
                        <select value={investmentState.partnerId} onChange={e => setInvestmentState({...investmentState, partnerId: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">Select Partner</option>
                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                   </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Account</label>
                        <select value={investmentState.accountId} onChange={e => setInvestmentState({...investmentState, accountId: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="">Select Account</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                   </div>
                   <div className="mb-4">
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" value={investmentState.amount} onChange={e => setInvestmentState({...investmentState, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                   </div>
                   <div className="mb-4">
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" value={investmentState.date} onChange={e => setInvestmentState({...investmentState, date: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                   </div>
                   <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setInvestmentModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Investment</Button>
                   </div>
                </form>
            </Modal>
        </div>
    );
};

export default Partners;