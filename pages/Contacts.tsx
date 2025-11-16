
import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Contact, ActionToProtect, ItemType } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ContactTable: React.FC<{ 
    title: string;
    data: Contact[];
    dues: Map<string, number>;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
}> = ({ title, data, dues, onEdit, onDelete }) => (
    <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Due Balance</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map(c => {
                            const dueAmount = dues.get(c.id) || 0;
                            return (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{c.phone}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${dueAmount > 0 ? 'text-red-500' : ''}`}>{dueAmount > 0 ? `৳${dueAmount.toLocaleString()}`: '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                    <button onClick={() => onDelete(c)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
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


const Contacts = () => {
    const { state, addItem, updateItem, deleteItem } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Contact | null>(null);
    const [formState, setFormState] = useState<Omit<Contact, 'id'>>({ name: '', phone: '', type: 'customer' });
    const [passwordProtectOpen, setPasswordProtectOpen] = useState(false);
    const [actionToProtect, setActionToProtect] = useState<ActionToProtect>(null);
    
    const handleOpenModal = (contact: Contact | null = null) => {
        setCurrentContact(contact);
        setFormState(contact ? { name: contact.name, phone: contact.phone, type: contact.type } : { name: '', phone: '', type: 'customer' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentContact(null);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentContact) {
            await updateItem('contacts', { id: currentContact.id, ...formState });
        } else {
            const payload: Contact = {
                id: `contact_${Date.now()}`,
                ...formState
            };
            await addItem('contacts', payload);
        }
        handleCloseModal();
    };

    const handleDelete = (contact: Contact) => {
        setActionToProtect({ type: 'delete', itemType: 'contact' as ItemType, payload: contact });
        setPasswordProtectOpen(true);
    };

    const dues = useMemo(() => {
        const contactDues = new Map<string, number>();

        state.sales.forEach(sale => {
            const total = sale.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const due = total - paid;
            if (due > 0) {
                contactDues.set(sale.customerId, (contactDues.get(sale.customerId) || 0) + due);
            }
        });

        state.purchases.forEach(purchase => {
            const total = purchase.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const paid = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
            const due = total - paid;
            if (due > 0) {
                contactDues.set(purchase.supplierId, (contactDues.get(purchase.supplierId) || 0) + due);
            }
        });

        return contactDues;
    }, [state.sales, state.purchases]);

    const suppliers = state.contacts.filter(c => c.type === 'supplier');
    const customers = state.contacts.filter(c => c.type === 'customer');
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Contacts</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5 mr-2 inline" /> Add Contact
                </Button>
            </div>
            
            <ContactTable title="Customers" data={customers} dues={dues} onEdit={handleOpenModal} onDelete={handleDelete} />
            <ContactTable title="Suppliers" data={suppliers} dues={dues} onEdit={handleOpenModal} onDelete={handleDelete} />
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentContact ? 'Edit Contact' : 'Add Contact'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Name</label>
                        <input type="text" name="name" value={formState.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Phone</label>
                        <input type="tel" name="phone" value={formState.phone} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Type</label>
                        <select name="type" value={formState.type} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                            <option value="customer">Customer</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>
            
             <PasswordProtect 
                isOpen={passwordProtectOpen}
                onClose={() => setPasswordProtectOpen(false)}
                onSuccess={async () => {
                    if (actionToProtect) {
                        await deleteItem('contacts', actionToProtect.payload.id);
                    }
                }}
                actionName="delete this contact"
            />
        </div>
    );
};

export default Contacts;