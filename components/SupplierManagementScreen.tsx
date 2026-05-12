import React, { useState } from 'react';
import { Supplier, PurchaseOrder, POStatus } from '../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  userRole?: string;
  onAddSupplier: (supplier: Supplier) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
}

const SupplierManagementScreen: React.FC<Props> = ({ suppliers, purchaseOrders, userRole, onAddSupplier, onUpdateSupplier, onDeleteSupplier }) => {
  const isReadOnly = userRole !== 'Admin';
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: '',
    country: ''
  });

  const handleEditClick = (supplier: Supplier) => {
    setIsEditing(supplier.id);
    setEditForm(supplier);
  };

  const handleSaveEdit = () => {
    if (isEditing && editForm.name && editForm.country) {
      onUpdateSupplier(editForm as Supplier);
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
    setNewSupplier({
      name: '',
      country: ''
    });
  };

  const getReliabilityScore = (supplierId: string) => {
    const pos = purchaseOrders.filter(po => po.supplierId === supplierId && po.status === POStatus.DELIVERED);
    if (pos.length === 0) return 100; // Default if no delivered POs
    const onTime = pos.filter(po => new Date(po.actualDeliveryDate!) <= new Date(po.expectedDeliveryDate)).length;
    return Math.round((onTime / pos.length) * 100);
  };

  const handleSaveAdd = () => {
    if (newSupplier.name && newSupplier.country) {
      const newId = `supplier-${Date.now()}`;
      onAddSupplier({ ...newSupplier, id: newId } as Supplier);
      setIsAdding(false);
      setNewSupplier({});
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewSupplier({});
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Supplier Management</h2>
        {!isReadOnly && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Supplier
          </button>
        )}
      </div>

      <MaximizeWrapper title="Supplier Management" className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Supplier Name</th>
              <th className="p-4 font-semibold text-slate-600">Country</th>
              <th className="p-4 font-semibold text-slate-600">Reliability Score (%)</th>
              {!isReadOnly && <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAdding && !isReadOnly && (
              <tr className="bg-blue-50">
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    className="w-full p-2 border rounded"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Country"
                    className="w-full p-2 border rounded"
                    value={newSupplier.country}
                    onChange={(e) => setNewSupplier({ ...newSupplier, country: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <span className="text-slate-400 italic">Auto-calculated</span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={handleSaveAdd} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                  <button onClick={handleCancelAdd} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                </td>
              </tr>
            )}

            {suppliers.map(supplier => (
              <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                {isEditing === supplier.id ? (
                  <>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400 italic">Auto-calculated</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                      <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium text-slate-800">{supplier.name}</td>
                    <td className="p-4 text-slate-600">{supplier.country}</td>
                    <td className="p-4 text-slate-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        getReliabilityScore(supplier.id) >= 90 ? 'bg-green-100 text-green-800' :
                        getReliabilityScore(supplier.id) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getReliabilityScore(supplier.id)}%
                      </span>
                    </td>
                    {!isReadOnly && (
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(supplier)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteSupplier(supplier.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            
            {!isAdding && suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No suppliers defined yet. Click "Add Supplier" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </MaximizeWrapper>
    </div>
  );
};

export default SupplierManagementScreen;
