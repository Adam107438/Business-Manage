
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Sale, Purchase, Payment, TransactionItem, ActionToProtect, ItemType, Product, Account } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, ArrowDownLeft, ArrowUpRight, Edit, Trash2, XCircle } from 'lucide-react';

const TransactionItemsFields: React.FC<{ 
    items: TransactionItem[], 
    form: 'sale' | 'purchase',
    products: Product[],
    onItemChange: (index: number, field: keyof TransactionItem, value: string | number, form: 'sale' | 'purchase') => void,
    onAddItem: (form: 'sale' | 'purchase') => void,
    onRemoveItem: (index: number, form: 'sale' | 'purchase') => void,
}> = ({items, form, products, onItemChange, onAddItem, onRemoveItem}) => (
    <div className="space-y-3">
        <h4 className="font-semibold">Products</h4>
        {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <div className="col-span-5">
                     <label className="block text-xs font-medium text-gray-500">Product</label>
                    <select value={item.productId} onChange={e => onItemChange(index, 'productId', e.target.value, form)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" required>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                    </select>
                </div>
                 <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500">Qty</label>
                    <input type="number" value={item.quantity} onChange={e => onItemChange(index, 'quantity', parseFloat(e.target.value) || 0, form)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" min="1" required/>
                </div>
                <div className="col-span-3">
                     <label className="block text-xs font-medium text-gray-500">Price</label>
                    <input type="number" value={item.price} onChange={e => onItemChange(index, 'price', parseFloat(e.target.value) || 0, form)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" required/>
                </div>
                 <div className="col-span-2 text-right">
                     <label className="block text-xs font-medium text-gray-500">Total</label>
                    <span className="text-sm font-semibold">{(item.quantity * item.price).toLocaleString()}</span>
                </div>
                {items.length > 1 && <div className="col-span-12 text-right -mt-2"><button type="button" onClick={() => onRemoveItem(index, form)} className="text-red-500 hover:text-red-700 p-1 text-xs">Remove</button></div>}
            </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onAddItem(form)} className="text-xs !py-1 !px-2">
            <Plus size={14} className="inline mr-1"/> Add Product
        </Button>
    </div>
);

const PaymentFields: React.FC<{
    payments: Payment[], 
    form: 'sale' | 'purchase',
    accounts: Account[],
    totalAmount: number,
    onPaymentChange: (index: number, field: 'accountId' | 'amount', value: string, form: 'sale' | 'purchase') => void,
    onAddPayment: (form: 'sale' | 'purchase') => void,
    onRemovePayment: (index: number, form: 'sale' | 'purchase') => void,
}> = ({ payments, form, accounts, totalAmount, onPaymentChange, onAddPayment, onRemovePayment }) => {
    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const due = totalAmount - totalPaid;

    return <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="font-semibold">Payment Details</h4>
        {payments.map((p, index) => (
            <div key={index} className="flex items-center gap-2">
                <select value={p.accountId} onChange={e => onPaymentChange(index, 'accountId', e.target.value, form)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 !mt-0" required>
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <input type="number" value={p.amount} onChange={e => onPaymentChange(index, 'amount', e.target.value, form)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 !mt-0" placeholder="Amount" required />
                {payments.length > 1 && <button type="button" onClick={() => onRemovePayment(index, form)} className="text-red-500 hover:text-red-700 p-1"><XCircle size={18}/></button>}
            </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onAddPayment(form)} className="text-xs !py-1 !px-2">Add another account</Button>
        <div className="grid grid-cols-3 text-sm font-semibold pt-2 border-t mt-2 border-gray-200 dark:border-gray-600">
            <span>Total: ৳{totalAmount.toLocaleString()}</span>
            <span className="text-center text-green-600 dark:text-green-400">Paid: ৳{totalPaid.toLocaleString()}</span>
            <span className={`text-right ${due > 0.01 ? 'text-red-500' : ''}`}>Due: ৳{due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
    </div>
};

const Transactions: React.FC = () => {
    const { state, addSale, updateSale, deleteSale, addPurchase, updatePurchase, deletePurchase } = useData();
    const { sales, purchases, contacts, products, accounts } = state;
    
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const [currentSale, setCurrentSale] = useState<Sale | null>(null);
    const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);

    const [passwordProtectOpen, setPasswordProtectOpen] = useState(false);
    const [actionToProtect, setActionToProtect] = useState<ActionToProtect>(null);
    
    const initialSaleState: Omit<Sale, 'id'> = { customerId: '', items: [{ productId: '', quantity: 1, price: 0 }], date: new Date().toISOString().split('T')[0], payments: [{ accountId: '', amount: 0 }], description: '' };
    const [saleForm, setSaleForm] = useState<Omit<Sale, 'id'>>(initialSaleState);

    const initialPurchaseState: Omit<Purchase, 'id'> = { supplierId: '', items: [{ productId: '', quantity: 1, price: 0 }], date: new Date().toISOString().split('T')[0], payments: [{ accountId: '', amount: 0 }], description: '' };
    const [purchaseForm, setPurchaseForm] = useState<Omit<Purchase, 'id'>>(initialPurchaseState);

    const suppliers = contacts.filter(c => c.type === 'supplier');
    const customers = contacts.filter(c => c.type === 'customer');
    
    const totalSaleAmount = useMemo(() => saleForm.items.reduce((sum, item) => sum + item.quantity * item.price, 0), [saleForm.items]);
    const totalPurchaseAmount = useMemo(() => purchaseForm.items.reduce((sum, item) => sum + item.quantity * item.price, 0), [purchaseForm.items]);

    const handleOpenSaleModal = (sale: Sale | null = null) => {
        setCurrentSale(sale);
        setSaleForm(sale ? { customerId: sale.customerId, items: sale.items, date: sale.date, payments: sale.payments, description: sale.description || '' } : initialSaleState);
        setIsSaleModalOpen(true);
    };

    const handleOpenPurchaseModal = (purchase: Purchase | null = null) => {
        setCurrentPurchase(purchase);
        setPurchaseForm(purchase ? { supplierId: purchase.supplierId, items: purchase.items, date: purchase.date, payments: purchase.payments, description: purchase.description || '' } : initialPurchaseState);
        setIsPurchaseModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsSaleModalOpen(false);
        setIsPurchaseModalOpen(false);
        setCurrentSale(null);
        setCurrentPurchase(null);
    };

    const handleDelete = (item: Sale | Purchase, type: 'sale' | 'purchase') => {
        setActionToProtect({ type: 'delete', itemType: type, payload: item });
        setPasswordProtectOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!actionToProtect) return;
        const { itemType, payload } = actionToProtect;
        if (itemType === 'sale') await deleteSale(payload as Sale);
        if (itemType === 'purchase') await deletePurchase(payload as Purchase);
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, form: 'sale' | 'purchase') => {
        const { name, value } = e.target;
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number, form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => {
            const newItems = [...prev.items];
            const oldItem = newItems[index];
            newItems[index] = { ...oldItem, [field]: value };

            if (field === 'productId') {
                const product = products.find(p => p.id === value);
                if (product) {
                    newItems[index].price = form === 'sale' ? product.price : product.cost;
                }
            }
            
            return { ...prev, items: newItems };
        });
    }

    const addItem = (form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => ({...prev, items: [...prev.items, { productId: '', quantity: 1, price: 0 }]}));
    }

    const removeItem = (index: number, form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            return {...prev, items: newItems};
        });
    }
    
    const handlePaymentChange = (index: number, field: 'accountId' | 'amount', value: string, form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => {
            const newPayments = [...prev.payments];
            newPayments[index] = {...newPayments[index], [field]: field === 'amount' ? parseFloat(value) || 0 : value};
            return {...prev, payments: newPayments};
        });
    };

    const addPayment = (form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => ({...prev, payments: [...prev.payments, {accountId: '', amount: 0}]}));
    };

    const removePayment = (index: number, form: 'sale' | 'purchase') => {
        const setter = form === 'sale' ? setSaleForm : setPurchaseForm;
        setter(prev => ({...prev, payments: prev.payments.filter((_, i) => i !== index)}));
    };

    const handleSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentSale) {
            await updateSale(currentSale, {id: currentSale.id, ...saleForm});
        } else {
            await addSale({id: `sale_${Date.now()}`, ...saleForm});
        }
        handleCloseModals();
    };

    const handlePurchaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPurchase) {
             await updatePurchase(currentPurchase, {id: currentPurchase.id, ...purchaseForm});
        } else {
            await addPurchase({id: `purchase_${Date.now()}`, ...purchaseForm});
        }
        handleCloseModals();
    };
    
    const TransactionTable: React.FC<{title: string, data: (Sale[] | Purchase[]), type: 'sale' | 'purchase'}> = ({ title, data, type }) => (
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">{type === 'sale' ? 'Customer' : 'Supplier'}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Due</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {data.map(item => {
                               const contactId = type === 'sale' ? (item as Sale).customerId : (item as Purchase).supplierId;
                               const contact = contacts.find(c => c.id === contactId);
                               const firstProduct = products.find(p => p.id === item.items[0]?.productId);
                               const total = item.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                               const paid = item.payments.reduce((sum, p) => sum + p.amount, 0);
                               const due = total - paid;

                                let status, statusColor;
                                if (due <= 0.01) {
                                    status = 'Paid';
                                    statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
                                } else if (paid > 0) {
                                    status = 'Partial';
                                    statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
                                } else {
                                    status = 'Unpaid';
                                    statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
                                }

                               return (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">{contact?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">{firstProduct?.name}{item.items.length > 1 ? ` (+${item.items.length - 1})` : ''}</td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400 max-w-xs truncate" title={(item as Sale).description}>
                                        {(item as Sale).description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap">৳{total.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap">৳{paid.toLocaleString()}</td>
                                    <td className={`px-6 py-4 text-sm font-semibold whitespace-nowrap ${due > 0 ? 'text-red-500' : ''}`}>{due > 0.01 ? `৳${due.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-sm whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => type === 'sale' ? handleOpenSaleModal(item as Sale) : handleOpenPurchaseModal(item as Purchase)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                        <button onClick={() => handleDelete(item, type)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                               )
                           })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Sales & Purchases</h2>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleOpenSaleModal()}>
                        <ArrowUpRight className="w-5 h-5 mr-2 inline" /> New Sale
                    </Button>
                    <Button onClick={() => handleOpenPurchaseModal()} variant="secondary">
                        <ArrowDownLeft className="w-5 h-5 mr-2 inline" /> New Purchase
                    </Button>
                </div>
            </div>
            
            <TransactionTable title="Sales" data={sales} type="sale" />
            <TransactionTable title="Purchases" data={purchases} type="purchase" />

            <Modal isOpen={isSaleModalOpen} onClose={handleCloseModals} title={currentSale ? 'Edit Sale' : 'New Sale Entry'}>
                <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Customer</label>
                            <select name="customerId" value={saleForm.customerId} onChange={e => handleFormChange(e, 'sale')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium">Date</label>
                             <input type="date" name="date" value={saleForm.date} onChange={e => handleFormChange(e, 'sale')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Description / Note</label>
                        <textarea
                            name="description"
                            value={saleForm.description || ''}
                            onChange={e => handleFormChange(e, 'sale')}
                            rows={2}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional note for this sale"
                        />
                    </div>
                    <TransactionItemsFields 
                        items={saleForm.items} 
                        form="sale"
                        products={products}
                        onItemChange={handleItemChange}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                    />
                    <PaymentFields 
                        payments={saleForm.payments} 
                        form="sale" 
                        accounts={accounts} 
                        totalAmount={totalSaleAmount}
                        onPaymentChange={handlePaymentChange}
                        onAddPayment={addPayment}
                        onRemovePayment={removePayment}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button type="submit">{currentSale ? 'Update Sale' : 'Record Sale'}</Button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isPurchaseModalOpen} onClose={handleCloseModals} title={currentPurchase ? 'Edit Purchase' : 'New Purchase Entry'}>
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Supplier</label>
                            <select name="supplierId" value={purchaseForm.supplierId} onChange={e => handleFormChange(e, 'purchase')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                 <option value="">Select Supplier</option>
                                 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium">Date</label>
                             <input type="date" name="date" value={purchaseForm.date} onChange={e => handleFormChange(e, 'purchase')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Description / Note</label>
                        <textarea
                            name="description"
                            value={purchaseForm.description || ''}
                            onChange={e => handleFormChange(e, 'purchase')}
                            rows={2}
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional note for this purchase"
                        />
                    </div>
                    <TransactionItemsFields 
                        items={purchaseForm.items} 
                        form="purchase"
                        products={products}
                        onItemChange={handleItemChange}
                        onAddItem={addItem}
                        onRemoveItem={removeItem}
                    />
                    <PaymentFields 
                        payments={purchaseForm.payments} 
                        form="purchase"
                        accounts={accounts}
                        totalAmount={totalPurchaseAmount}
                        onPaymentChange={handlePaymentChange}
                        onAddPayment={addPayment}
                        onRemovePayment={removePayment}
                    />
                     <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button type="submit">{currentPurchase ? 'Update Purchase' : 'Record Purchase'}</Button>
                    </div>
                </form>
            </Modal>
            
            <PasswordProtect 
                isOpen={passwordProtectOpen}
                onClose={() => setPasswordProtectOpen(false)}
                onSuccess={confirmDelete}
                actionName="delete this transaction"
            />
        </div>
    );
};

export default Transactions;