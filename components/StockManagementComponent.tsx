import React, { useState, useMemo } from 'react';
import { Product, StockMovement, StockMovementType } from '../types';
import { Button, Input, Modal, Card, TextArea } from './common';
import { PlusIcon } from './icons';

interface StockManagementComponentProps {
  products: Product[];
  stock: StockMovement[];
  onSave: (stockMovements: StockMovement[], updatedProducts: Product[]) => void;
  lowStockThreshold: number;
}

const emptyMovement = {
    productId: '',
    type: StockMovementType.IN,
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: '',
};

export const StockManagementComponent: React.FC<StockManagementComponentProps> = ({ products, stock, onSave, lowStockThreshold }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMovement, setNewMovement] = useState(emptyMovement);
    const [searchTerm, setSearchTerm] = useState('');
    const [historySearchTerm, setHistorySearchTerm] = useState('');


    const sortedHistory = useMemo(() => {
        const historyWithProductNames = stock.map(s => {
            const product = products.find(p => p.id === s.productId);
            return { ...s, productName: product?.name || 'N/A' };
        });

        const filtered = historyWithProductNames.filter(s =>
            s.productName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
            s.notes.toLowerCase().includes(historySearchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stock, products, historySearchTerm]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.specification.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleOpenModal = () => {
        setNewMovement({
            ...emptyMovement,
            productId: products.length > 0 ? products[0].id : '',
        });
        setIsModalOpen(true);
    };
    
    const handleMovementChange = (field: keyof typeof emptyMovement, value: string | number | StockMovementType) => {
        setNewMovement(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveMovement = () => {
        const { productId, quantity, type } = newMovement;
        if (!productId || !quantity || quantity <= 0) {
            alert("Please select a product and enter a valid quantity.");
            return;
        }

        const product = products.find(p => p.id === productId);
        if (!product) {
            alert("Product not found.");
            return;
        }
        
        if (type === StockMovementType.OUT && quantity > product.quantity) {
            alert(`Cannot stock out more than available quantity (${product.quantity}).`);
            return;
        }

        const newStockRecord: StockMovement = {
            id: `stock_${new Date().getTime()}`,
            productName: product.name,
            ...newMovement,
        };

        const updatedStock = [newStockRecord, ...stock];

        const newQuantity = type === StockMovementType.IN
            ? product.quantity + quantity
            : product.quantity - quantity;

        const updatedProducts = products.map(p =>
            p.id === productId ? { ...p, quantity: newQuantity } : p
        );
        
        onSave(updatedStock, updatedProducts);
        setIsModalOpen(false);
    };
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stock Management</h1>
                    <Button onClick={handleOpenModal} className="flex items-center space-x-2">
                        <PlusIcon />
                        <span>Record Movement</span>
                    </Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Current Stock Levels</h2>
                <Input
                    label=""
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
                            <tr>
                                <th className="p-3">Product Name</th>
                                <th className="p-3">Specification</th>
                                <th className="p-3 text-right">Available Quantity</th>
                                <th className="p-3 text-right">Total Value</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 font-medium">{product.name}</td>
                                <td className="p-3">{product.specification}</td>
                                <td className="p-3 text-right font-semibold">{product.quantity}</td>
                                <td className="p-3 text-right">{formatCurrency(product.quantity * product.unitPrice)}</td>
                                <td className="p-3 text-center">
                                    {product.quantity <= lowStockThreshold ? (
                                        <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-200">Low Stock</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">In Stock</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                     {filteredProducts.length === 0 && <p className="text-center py-4 text-gray-500">No products match your search.</p>}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Movement History</h2>
                 <Input
                    label=""
                    type="text"
                    placeholder="Search history..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="mb-4"
                />
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left table-auto">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm sticky top-0">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Product</th>
                                <th className="p-3">Type</th>
                                <th className="p-3 text-right">Quantity</th>
                                <th className="p-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                            {sortedHistory.map(item => (
                                <tr key={item.id} className="border-b dark:border-gray-700">
                                    <td className="p-3">{new Date(item.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium">{item.productName}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === StockMovementType.IN ? 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200' : 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                                            Stock {item.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-semibold">{item.quantity}</td>
                                    <td className="p-3 text-sm italic text-gray-500">{item.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedHistory.length === 0 && <p className="text-center py-4 text-gray-500">No stock movements recorded.</p>}
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Stock Movement">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                        <select
                            value={newMovement.productId}
                            onChange={(e) => handleMovementChange('productId', e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Movement Type</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="flex items-center">
                                <input type="radio" name="movementType" value={StockMovementType.IN} checked={newMovement.type === StockMovementType.IN} onChange={() => handleMovementChange('type', StockMovementType.IN)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                <span className="ml-2">Stock In</span>
                            </label>
                            <label className="flex items-center">
                                <input type="radio" name="movementType" value={StockMovementType.OUT} checked={newMovement.type === StockMovementType.OUT} onChange={() => handleMovementChange('type', StockMovementType.OUT)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                                <span className="ml-2">Stock Out</span>
                            </label>
                        </div>
                    </div>

                    <Input
                        label="Quantity"
                        type="number"
                        value={newMovement.quantity}
                        onChange={(e) => handleMovementChange('quantity', parseInt(e.target.value, 10) || 0)}
                        min="1"
                        required
                    />

                    <Input
                        label="Date"
                        type="date"
                        value={newMovement.date}
                        onChange={(e) => handleMovementChange('date', e.target.value)}
                        required
                    />

                    <TextArea
                        label="Notes / Remarks"
                        value={newMovement.notes}
                        onChange={(e) => handleMovementChange('notes', e.target.value)}
                        placeholder="e.g., Received from supplier, Sale to customer X"
                        rows={3}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveMovement}>Save Movement</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
