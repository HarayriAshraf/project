import React, { useState } from 'react';
import { Product, BOMItem } from '../types';
import { Plus, Edit2, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  products: Product[];
  userRole?: string;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductManagementScreen: React.FC<Props> = ({ products, userRole, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const isReadOnly = userRole === 'Sales' || userRole === 'Manager';
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    hasBOM: false,
    bom: [],
    leadTimeWeeks: 1,
    category: ''
  });

  const getCalculatedLeadTime = (bom: BOMItem[] | undefined) => {
    if (!bom || bom.length === 0) return 0;
    return Math.max(...bom.map(b => {
      const comp = products.find(p => p.id === b.productId);
      return comp ? comp.leadTimeWeeks : 0;
    }));
  };

  const handleEditClick = (product: Product) => {
    setIsEditing(product.id);
    setEditForm({ ...product, bom: product.bom ? [...product.bom] : [] });
  };

  const handleSaveEdit = () => {
    if (isEditing && editForm.name) {
      const finalLeadTime = editForm.hasBOM ? getCalculatedLeadTime(editForm.bom) : (editForm.leadTimeWeeks || 0);
      onUpdateProduct({ ...editForm, leadTimeWeeks: finalLeadTime } as Product);
      setIsEditing(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setNewProduct({
      name: '',
      hasBOM: false,
      bom: [],
      leadTimeWeeks: 1,
      category: ''
    });
  };

  const handleSaveAdd = () => {
    if (newProduct.name) {
      const finalLeadTime = newProduct.hasBOM ? getCalculatedLeadTime(newProduct.bom) : (newProduct.leadTimeWeeks || 0);
      const newId = `prod-${Date.now()}`;
      onAddProduct({ ...newProduct, id: newId, leadTimeWeeks: finalLeadTime } as Product);
      setIsAdding(false);
      setNewProduct({});
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewProduct({});
  };

  const addBomItemToForm = (form: Partial<Product>, setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>) => {
    const currentBom = form.bom || [];
    setForm({ ...form, bom: [...currentBom, { productId: '', quantity: 1 }] });
  };

  const updateBomItemInForm = (form: Partial<Product>, setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>, index: number, field: keyof BOMItem, value: any) => {
    const currentBom = [...(form.bom || [])];
    currentBom[index] = { ...currentBom[index], [field]: value };
    setForm({ ...form, bom: currentBom });
  };

  const removeBomItemFromForm = (form: Partial<Product>, setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>, index: number) => {
    const currentBom = [...(form.bom || [])];
    currentBom.splice(index, 1);
    setForm({ ...form, bom: currentBom });
  };

  const renderBOMEditor = (form: Partial<Product>, setForm: React.Dispatch<React.SetStateAction<Partial<Product>>>) => {
    if (!form.hasBOM) return null;
    
    return (
      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">BOM Components</h4>
        {form.bom && form.bom.length > 0 ? (
          <div className="space-y-2 mb-3">
            {form.bom.map((item, idx) => {
              const comp = products.find(p => p.id === item.productId);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <select 
                    className="flex-1 p-1.5 text-sm border rounded"
                    value={item.productId}
                    onChange={(e) => updateBomItemInForm(form, setForm, idx, 'productId', e.target.value)}
                  >
                    <option value="">Select component...</option>
                    {products.filter(p => p.id !== form.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 w-12 text-center" title="Component Lead Time">
                    {comp ? `${comp.leadTimeWeeks}w` : '-'}
                  </span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="w-20 p-1.5 text-sm border rounded"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateBomItemInForm(form, setForm, idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                  <button 
                    onClick={() => removeBomItemFromForm(form, setForm, idx)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-3 italic">No components added yet.</p>
        )}
        <button 
          onClick={() => addBomItemToForm(form, setForm)}
          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus size={14} /> Add Component
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Product Management</h2>
        {!isReadOnly && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Product
          </button>
        )}
      </div>

      <MaximizeWrapper title="Product Management" className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Product Name</th>
              <th className="p-4 font-semibold text-slate-600">Category</th>
              <th className="p-4 font-semibold text-slate-600">Lead Time (Weeks)</th>
              <th className="p-4 font-semibold text-slate-600">BOM</th>
              {!isReadOnly && <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAdding && !isReadOnly && (
              <tr className="bg-blue-50">
                <td className="p-4 align-top">
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="w-full p-2 border rounded mb-2"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </td>
                <td className="p-4 align-top">
                  <input
                    type="text"
                    placeholder="Category"
                    className="w-full p-2 border rounded"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </td>
                <td className="p-4 align-top">
                  {newProduct.hasBOM ? (
                    <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 text-sm flex items-center justify-between">
                      <span className="font-medium">{getCalculatedLeadTime(newProduct.bom)}</span>
                      <span className="text-[10px] uppercase tracking-wider">Auto (Max)</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      placeholder="Weeks"
                      className="w-full p-2 border rounded"
                      value={newProduct.leadTimeWeeks}
                      onChange={(e) => setNewProduct({ ...newProduct, leadTimeWeeks: parseInt(e.target.value) || 0 })}
                    />
                  )}
                </td>
                <td className="p-4 align-top">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setNewProduct({ ...newProduct, hasBOM: !newProduct.hasBOM })}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${newProduct.hasBOM ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {newProduct.hasBOM ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {newProduct.hasBOM ? 'On' : 'Off'}
                    </button>
                  </div>
                  {renderBOMEditor(newProduct, setNewProduct)}
                </td>
                <td className="p-4 text-right align-top space-x-2">
                  <button onClick={handleSaveAdd} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                  <button onClick={handleCancelAdd} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                </td>
              </tr>
            )}

            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                {isEditing === product.id ? (
                  <>
                    <td className="p-4 align-top">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td className="p-4 align-top">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      />
                    </td>
                    <td className="p-4 align-top">
                      {editForm.hasBOM ? (
                        <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-slate-500 text-sm flex items-center justify-between">
                          <span className="font-medium">{getCalculatedLeadTime(editForm.bom)}</span>
                          <span className="text-[10px] uppercase tracking-wider">Auto (Max)</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          className="w-full p-2 border rounded"
                          value={editForm.leadTimeWeeks}
                          onChange={(e) => setEditForm({ ...editForm, leadTimeWeeks: parseInt(e.target.value) || 0 })}
                        />
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setEditForm({ ...editForm, hasBOM: !editForm.hasBOM })}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${editForm.hasBOM ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {editForm.hasBOM ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {editForm.hasBOM ? 'On' : 'Off'}
                        </button>
                      </div>
                      {renderBOMEditor(editForm, setEditForm)}
                    </td>
                    <td className="p-4 text-right align-top space-x-2">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                      <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium text-slate-800 align-top">{product.name}</td>
                    <td className="p-4 text-slate-600 align-top">{product.category}</td>
                    <td className="p-4 text-slate-600 align-top">
                      {product.hasBOM ? (
                        <span className="flex items-center gap-2">
                          {getCalculatedLeadTime(product.bom)} weeks
                          <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wider">Auto</span>
                        </span>
                      ) : (
                        `${product.leadTimeWeeks} weeks`
                      )}
                    </td>
                    <td className="p-4 text-slate-600 align-top">
                      {product.hasBOM ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs mb-2">Active</span>
                          <ul className="text-xs text-slate-500 space-y-1">
                            {product.bom?.map((b, i) => {
                              const comp = products.find(p => p.id === b.productId);
                              return (
                                <li key={i} className="flex justify-between items-center border-b border-slate-100 pb-1">
                                  <span>{comp ? comp.name : 'Unknown'}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400">{comp ? `${comp.leadTimeWeeks}w` : ''}</span>
                                    <span className="font-mono bg-slate-50 px-1 rounded">{b.quantity}x</span>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Off (Raw Material)</span>
                      )}
                    </td>
                    {!isReadOnly && (
                      <td className="p-4 text-right align-top space-x-2">
                        <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            
            {!isAdding && products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No products defined yet. Click "Add Product" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </MaximizeWrapper>
    </div>
  );
};

export default ProductManagementScreen;
