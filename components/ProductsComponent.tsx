import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Button, Input, Modal, Card } from './common';
import { PlusIcon, EditIcon, TrashIcon } from './icons';

interface ProductsComponentProps {
  products: Product[];
  onSave: (products: Product[]) => void;
}

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  specification: '',
  quantity: 0,
  unitPrice: 0,
};

export const ProductsComponent: React.FC<ProductsComponentProps> = ({ products, onSave }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specification.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleAddNew = () => {
    setCurrentProduct(emptyProduct);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      onSave(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleSave = () => {
    if (!currentProduct || !currentProduct.name) return;

    let updatedProducts;
    if (currentProduct.id) { // Editing existing product
      updatedProducts = products.map(p => p.id === currentProduct.id ? currentProduct as Product : p);
    } else { // Adding new product
      const newProduct: Product = {
        ...currentProduct,
        id: `prod_${new Date().getTime()}`,
      } as Product;
      updatedProducts = [...products, newProduct];
    }
    onSave(updatedProducts);
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Products</h1>
          <div className="flex space-x-2">
            <Input
                label=""
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!mt-0"
            />
            <Button onClick={handleAddNew} className="flex items-center space-x-2">
              <PlusIcon />
              <span>Add Product</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Specification</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Total Value</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3">{product.specification}</td>
                  <td className="p-3 text-right">{product.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(product.unitPrice)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(product.quantity * product.unitPrice)}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                      <button onClick={() => handleDelete(product)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <p className="text-center py-4 text-gray-500">No products found.</p>}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProduct?.id ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          <Input
            label="Product Name"
            type="text"
            value={currentProduct?.name || ''}
            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            required
          />
          <Input
            label="Specification"
            type="text"
            value={currentProduct?.specification || ''}
            onChange={(e) => setCurrentProduct({ ...currentProduct, specification: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={currentProduct?.quantity || 0}
              onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: parseInt(e.target.value, 10) || 0 })}
              required
            />
            <Input
              label="Unit Price"
              type="number"
              value={currentProduct?.unitPrice || 0}
              onChange={(e) => setCurrentProduct({ ...currentProduct, unitPrice: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Product</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirm Deletion">
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the product "{productToDelete?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
