
import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { Product, ActionToProtect, ItemType } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PasswordProtect from '../components/PasswordProtect';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Inventory = () => {
    const { state, addItem, updateItem, deleteItem } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [formState, setFormState] = useState<Omit<Product, 'id' | 'stock'>>({ name: '', size: '', color: '', price: 0, cost: 0 });
    const [passwordProtectOpen, setPasswordProtectOpen] = useState(false);
    const [actionToProtect, setActionToProtect] = useState<ActionToProtect>(null);
    
    const handleOpenModal = (product: Product | null = null) => {
        setCurrentProduct(product);
        setFormState(product ? { name: product.name, size: product.size || '', color: product.color || '', price: product.price, cost: product.cost } : { name: '', size: '', color: '', price: 0, cost: 0 });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: name === 'price' || name === 'cost' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentProduct) {
            await updateItem('products', { ...currentProduct, ...formState });
        } else {
            const payload: Product = {
                id: `prod_${Date.now()}`,
                stock: 0,
                ...formState,
            };
            await addItem('products', payload);
        }
        handleCloseModal();
    };

    const handleDelete = (product: Product) => {
        setActionToProtect({ type: 'delete', itemType: 'product' as ItemType, payload: product });
        setPasswordProtectOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Inventory / Products</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5 mr-2 inline" /> Add Product
                </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                           <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Size/Color</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                           </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {state.products.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.size || 'N/A'} / {p.color || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">৳{p.cost.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">৳{p.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(p)} className="text-blue-600 hover:text-blue-900 mr-4"><Edit size={18}/></button>
                                        <button onClick={() => handleDelete(p)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentProduct ? 'Edit Product' : 'Add Product'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Product Name</label>
                        <input type="text" name="name" value={formState.name} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Size</label>
                            <input type="text" name="size" value={formState.size} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Color</label>
                            <input type="text" name="color" value={formState.color} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Cost Price</label>
                            <input type="number" name="cost" value={formState.cost} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Sale Price</label>
                            <input type="number" name="price" value={formState.price} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                    </div>
                    {currentProduct && <p className="text-sm text-gray-500">Stock level is managed through Purchases and Sales.</p>}
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
                        await deleteItem('products', actionToProtect.payload.id);
                    }
                }}
                actionName="delete this product"
            />
        </div>
    );
};

export default Inventory;