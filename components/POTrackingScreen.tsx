import React, { useState } from 'react';
import { PurchaseOrder, Supplier, Product, POStatus } from '../types';
import { Plus, Edit2, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  userRole?: string;
  onAddPO: (po: PurchaseOrder) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
}

const POTrackingScreen: React.FC<Props> = ({ purchaseOrders, suppliers, products, userRole, onAddPO, onUpdatePO, onDeletePO }) => {
  const isReadOnly = userRole === 'Sales' || userRole === 'Manager';
  const [isAdding, setIsAdding] = useState(false);
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    supplierId: '',
    productId: '',
    quantity: 0,
    orderDate: new Date().toISOString().split('T')[0],
    leadTimeWeeks: 0,
    expectedDeliveryDate: '',
    status: POStatus.PENDING
  });

  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [actualDeliveryDate, setActualDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const calculateExpectedDelivery = (dateStr: string, weeks: number) => {
    if (!dateStr || isNaN(weeks)) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + weeks * 7);
    return date.toISOString().split('T')[0];
  };

  const handleAddClick = () => {
    setIsAdding(true);
    const defaultProduct = products[0];
    const defaultLeadTime = defaultProduct ? defaultProduct.leadTimeWeeks : 0;
    const defaultOrderDate = new Date().toISOString().split('T')[0];
    
    setNewPO({
      supplierId: suppliers[0]?.id || '',
      productId: defaultProduct?.id || '',
      quantity: 0,
      orderDate: defaultOrderDate,
      leadTimeWeeks: defaultLeadTime,
      expectedDeliveryDate: calculateExpectedDelivery(defaultOrderDate, defaultLeadTime),
      status: POStatus.PENDING
    });
  };

  const handleSaveAdd = () => {
    if (newPO.supplierId && newPO.productId && newPO.quantity && newPO.orderDate && newPO.expectedDeliveryDate) {
      const newId = `po-${Date.now()}`;
      onAddPO({ ...newPO, id: newId } as PurchaseOrder);
      setIsAdding(false);
      setNewPO({});
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewPO({});
  };

  const handleMarkDelivered = (po: PurchaseOrder) => {
    if (actualDeliveryDate) {
      onUpdatePO({
        ...po,
        status: POStatus.DELIVERED,
        actualDeliveryDate
      });
      setDeliveringId(null);
    }
  };

  const handleCancelPO = (po: PurchaseOrder) => {
    if (window.confirm('Are you sure you want to cancel this PO?')) {
      onUpdatePO({
        ...po,
        status: POStatus.CANCELLED
      });
    }
  };

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown';
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Order Tracking</h2>
          <p className="text-slate-500">Track expected vs. actual delivery dates to calculate supplier reliability.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create PO
          </button>
        )}
      </div>

      <MaximizeWrapper title="Purchase Order Tracking" className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">PO ID</th>
              <th className="p-4 font-semibold text-slate-600">Supplier</th>
              <th className="p-4 font-semibold text-slate-600">Product</th>
              <th className="p-4 font-semibold text-slate-600">Qty</th>
              <th className="p-4 font-semibold text-slate-600">Order Date</th>
              <th className="p-4 font-semibold text-slate-600">Lead Time (Wks)</th>
              <th className="p-4 font-semibold text-slate-600">Expected</th>
              <th className="p-4 font-semibold text-slate-600">Actual</th>
              <th className="p-4 font-semibold text-slate-600">Status</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAdding && (
              <tr className="bg-blue-50">
                <td className="p-4 text-slate-400 italic">Auto</td>
                <td className="p-4">
                  <select
                    className="w-full p-2 border rounded"
                    value={newPO.supplierId}
                    onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  <select
                    className="w-full p-2 border rounded"
                    value={newPO.productId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const prod = products.find(p => p.id === prodId);
                      const lt = prod ? prod.leadTimeWeeks : 0;
                      setNewPO({ 
                        ...newPO, 
                        productId: prodId,
                        leadTimeWeeks: lt,
                        expectedDeliveryDate: calculateExpectedDelivery(newPO.orderDate || '', lt)
                      });
                    }}
                  >
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded"
                    value={newPO.quantity || ''}
                    onChange={(e) => setNewPO({ ...newPO, quantity: parseInt(e.target.value) || 0 })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={newPO.orderDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setNewPO({ 
                        ...newPO, 
                        orderDate: newDate,
                        expectedDeliveryDate: calculateExpectedDelivery(newDate, newPO.leadTimeWeeks || 0)
                      });
                    }}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded"
                    value={newPO.leadTimeWeeks || 0}
                    onChange={(e) => {
                      const lt = parseInt(e.target.value) || 0;
                      setNewPO({
                        ...newPO,
                        leadTimeWeeks: lt,
                        expectedDeliveryDate: calculateExpectedDelivery(newPO.orderDate || '', lt)
                      });
                    }}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="date"
                    className="w-full p-2 border rounded bg-slate-100 text-slate-500"
                    value={newPO.expectedDeliveryDate}
                    readOnly
                  />
                </td>
                <td className="p-4 text-slate-400">-</td>
                <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span></td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={handleSaveAdd} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                  <button onClick={handleCancelAdd} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                </td>
              </tr>
            )}

            {purchaseOrders.map(po => (
              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-slate-500">{po.id.split('-')[1]}</td>
                <td className="p-4 font-medium text-slate-800">{getSupplierName(po.supplierId)}</td>
                <td className="p-4 text-slate-600">{getProductName(po.productId)}</td>
                <td className="p-4 text-slate-600">{po.quantity}</td>
                <td className="p-4 text-slate-600">{po.orderDate}</td>
                <td className="p-4 text-slate-600">{po.leadTimeWeeks !== undefined ? po.leadTimeWeeks : '-'}</td>
                <td className="p-4 text-slate-600">{po.expectedDeliveryDate}</td>
                
                {deliveringId === po.id ? (
                  <td className="p-4" colSpan={2}>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className="p-1 border rounded text-sm"
                        value={actualDeliveryDate}
                        onChange={(e) => setActualDeliveryDate(e.target.value)}
                      />
                      <button onClick={() => handleMarkDelivered(po)} className="text-green-600 hover:text-green-800 text-xs font-bold bg-green-50 px-2 py-1 rounded">Confirm</button>
                      <button onClick={() => setDeliveringId(null)} className="text-slate-500 hover:text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded">Cancel</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="p-4 text-slate-600">
                      {po.actualDeliveryDate ? (
                        <span className={new Date(po.actualDeliveryDate) <= new Date(po.expectedDeliveryDate) ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {po.actualDeliveryDate}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        po.status === POStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                        po.status === POStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </>
                )}

                <td className="p-4 text-right space-x-2">
                  {!isReadOnly && po.status === POStatus.PENDING && deliveringId !== po.id && (
                    <>
                      <button onClick={() => { setDeliveringId(po.id); setActualDeliveryDate(new Date().toISOString().split('T')[0]); }} className="text-green-600 hover:text-green-800" title="Mark Delivered"><CheckCircle size={18} /></button>
                      <button onClick={() => handleCancelPO(po)} className="text-orange-600 hover:text-orange-800" title="Cancel PO"><XCircle size={18} /></button>
                    </>
                  )}
                  {!isReadOnly && (
                    <button onClick={() => onDeletePO(po.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
            
            {!isAdding && purchaseOrders.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  No purchase orders found. Click "Create PO" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </MaximizeWrapper>
    </div>
  );
};

export default POTrackingScreen;
