
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Expense, ExpenseCategory, ActionToProtect, ItemType } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Expenses = () => {
    const { state, addItem, updateItem, deleteItem, addExpense, updateExpense, deleteExpense } = useData();
    const { expenseCategories, expenses, accounts } = state;

    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    
    const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | null>(null);
    const [categoryName, setCategoryName] = useState('');
    
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
    const initialExpenseState = { categoryId: '', item: '', amount: 0, date: new Date().toISOString().split('T')[0], accountId: '' };
    const [expenseForm, setExpenseForm] = useState<Omit<Expense, 'id'>>(initialExpenseState);

    const [passwordProtectOpen, setPasswordProtectOpen] = useState(false);
    const [actionToProtect, setActionToProtect] = useState<ActionToProtect>(null);

    // Category Logic
    const handleOpenCategoryModal = (category: ExpenseCategory | null = null) => {
        setCurrentCategory(category);
        setCategoryName(category ? category.name : '');
        setCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentCategory) {
            await updateItem('expenseCategories', { id: currentCategory.id, name: categoryName });
        } else {
            const payload: ExpenseCategory = {
                id: `exp_cat_${Date.now()}`,
                name: categoryName,
            };
            await addItem('expenseCategories', payload);
        }
        setCategoryModalOpen(false);
    };
    
    const handleCategoryDelete = (category: ExpenseCategory) => {
         setActionToProtect({ type: 'delete', itemType: 'expenseCategory' as ItemType, payload: category });
        setPasswordProtectOpen(true);
    }
    
    const confirmDelete = async () => {
        if (!actionToProtect) return;
        const { itemType, payload } = actionToProtect;
        if (itemType === 'expenseCategory') {
            await deleteItem('expenseCategories', payload.id);
        }
        if (itemType === 'expense') {
            await deleteExpense(payload as Expense);
        }
    }

    // Expense Logic
     const handleOpenExpenseModal = (expense: Expense | null = null) => {
        setCurrentExpense(expense);
        setExpenseForm(expense ? { categoryId: expense.categoryId, item: expense.item, amount: expense.amount, date: expense.date, accountId: expense.accountId } : initialExpenseState);
        setExpenseModalOpen(true);
    };
    
    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentExpense) {
            await updateExpense(currentExpense, {id: currentExpense.id, ...expenseForm});
        } else {
            const payload: Expense = {
                id: `exp_${Date.now()}`,
                ...expenseForm
            };
            await addExpense(payload);
        }
        setExpenseModalOpen(false);
    };

    const handleExpenseDelete = (expense: Expense) => {
        setActionToProtect({ type: 'delete', itemType: 'expense' as ItemType, payload: expense });
        setPasswordProtectOpen(true);
    };

    const getCategoryName = (id: string) => expenseCategories.find(c => c.id === id)?.name || 'N/A';
    
    return (
        <div className="space-y-8">
            {/* Categories Section */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Expense Categories</h2>
                <Button onClick={() => handleOpenCategoryModal()}>
                    <Plus className="w-5 h-5 mr-2 inline" /> Add Category
                </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                    {expenseCategories.map(cat => (
                        <div key={cat.id} className="group relative flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-1">
                                <button onClick={() => handleOpenCategoryModal(cat)} className="p-1 text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><Edit size={14} /></button>
                                <button onClick={() => handleCategoryDelete(cat)} className="p-1 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expenses Section */}
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Expenses</h2>
                <Button onClick={() => handleOpenExpenseModal()}>
                    <Plus className="w-5 h-5 mr-2 inline" /> Add Expense
                </Button>
            </div>
             <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Item/Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{getCategoryName(exp.categoryId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{exp.item}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">৳{exp.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenExpenseModal(exp)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                        <button onClick={() => handleExpenseDelete(exp)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Modal */}
            <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={currentCategory ? 'Edit Category' : 'Add Category'}>
                 <form onSubmit={handleCategorySubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Category Name</label>
                        <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>
            
            {/* Expense Modal */}
            <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={currentExpense ? 'Edit Expense' : 'Add Expense'}>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Category</label>
                        <select value={expenseForm.categoryId} onChange={e => setExpenseForm({...expenseForm, categoryId: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                             <option value="">Select Category</option>
                             {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Item/Details</label>
                        <input type="text" value={expenseForm.item} onChange={e => setExpenseForm({...expenseForm, item: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Amount</label>
                        <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Account</label>
                        <select value={expenseForm.accountId} onChange={e => setExpenseForm({...expenseForm, accountId: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                             <option value="">Select Account</option>
                             {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Date</label>
                        <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{currentExpense ? 'Update Expense' : 'Add Expense'}</Button>
                    </div>
                </form>
            </Modal>
            
            <PasswordProtect 
                isOpen={passwordProtectOpen}
                onClose={() => setPasswordProtectOpen(false)}
                onSuccess={confirmDelete}
                actionName={`delete this ${actionToProtect?.itemType}`}
            />
        </div>
    );
};

export default Expenses;