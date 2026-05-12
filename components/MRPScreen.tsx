import React, { useMemo, useState, useEffect } from 'react';
import { ForecastRecord, Product, Supplier, PurchaseOrder } from '../types';
import { Calculator, Calendar, AlertCircle, Filter, CheckCircle2, X } from 'lucide-react';
import { MultiSelect } from './MultiSelect';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  userRole?: string;
}

interface MRPResult {
  id: string;
  orderDate: Date;
  orderDateStr: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  targetMonth: number;
  targetYear: number;
  orderMonth: number;
  orderYear: number;
  supplier?: string;
  client: string;
  subsidiary?: string;
  section?: string;
  status: 'Pending' | 'Ordered';
  orderRef?: string;
}

const MRPScreen: React.FC<Props> = ({ data, products, suppliers, purchaseOrders, userRole }) => {
  const isReadOnly = userRole === 'Sales' || userRole === 'Manager';
  const [demandSource, setDemandSource] = useState<'SOP' | 'BOOKED' | 'BOTH'>('SOP');
  const [filterProduct, setFilterProduct] = useState<string[]>([]);
  const [filterMonth, setFilterMonth] = useState<string[]>([]);
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [filterClient, setFilterClient] = useState<string[]>([]);
  const [filterSubsidiary, setFilterSubsidiary] = useState<string[]>([]);
  const [filterSection, setFilterSection] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState<Record<string, { status: 'Pending' | 'Ordered', ref: string }>>({});
  const [selectedMrpId, setSelectedMrpId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mrpPlan = useMemo(() => {
    const plan: Record<string, MRPResult> = {}; // key: `${orderDateStr}-${productId}-${supplier}-${client}`

    // Filter based on demand source
    const activeForecasts = data.filter(d => {
      if (demandSource === 'SOP') return d.status === 'Forecasted' || d.status === 'Draft';
      if (demandSource === 'BOOKED') return d.status === 'Booked';
      return d.status === 'Forecasted' || d.status === 'Booked' || d.status === 'Draft';
    });

    activeForecasts.forEach(forecast => {
      const product = products.find(p => p.name === forecast.product);
      
      const supplier = forecast.supplier || 'Unassigned';
      const client = forecast.client || 'Unknown Client';

      // Assume forecast is required by the 15th of the forecast month
      const forecastDate = new Date(forecast.year, forecast.month - 1, 15);

      if (product && product.hasBOM && product.bom && product.bom.length > 0) {
        // Finished Good: Order its components based on BOM
        product.bom.forEach(bomItem => {
          const compProduct = products.find(p => p.id === bomItem.productId);
          if (!compProduct) return;

          const requiredQty = forecast.qty * bomItem.quantity;
          
          // Calculate order date: forecastDate - (leadTimeWeeks * 7 days)
          const orderDate = new Date(forecastDate);
          orderDate.setDate(orderDate.getDate() - (compProduct.leadTimeWeeks * 7));
          const orderDateStr = orderDate.toISOString().split('T')[0];

          const key = `${orderDateStr}-${compProduct.id}-${supplier}-${client}`;
          if (!plan[key]) {
            plan[key] = { 
              id: key,
              orderDate,
              orderDateStr,
              productId: compProduct.id, 
              productName: compProduct.name, 
              category: compProduct.category || 'Raw Material',
              quantity: 0,
              targetMonth: forecast.month,
              targetYear: forecast.year,
              orderMonth: orderDate.getMonth() + 1,
              orderYear: orderDate.getFullYear(),
              supplier,
              client,
              subsidiary: forecast.subsidiary,
              section: forecast.section,
              status: orderStatuses[key]?.status || 'Pending',
              orderRef: orderStatuses[key]?.ref || ''
            };
          }
          plan[key].quantity += requiredQty;
        });
      } else {
        // Raw Material or item without BOM: Order itself
        const leadTimeWeeks = product ? product.leadTimeWeeks : 4; // Default to 4 weeks if product not found
        const orderDate = new Date(forecastDate);
        orderDate.setDate(orderDate.getDate() - (leadTimeWeeks * 7));
        const orderDateStr = orderDate.toISOString().split('T')[0];

        const key = `${orderDateStr}-${product?.id || forecast.product}-${supplier}-${client}`;
        if (!plan[key]) {
          plan[key] = { 
            id: key,
            orderDate,
            orderDateStr,
            productId: product?.id || forecast.product, 
            productName: product?.name || forecast.product, 
            category: product?.category || forecast.category || 'Raw Material',
            quantity: 0,
            targetMonth: forecast.month,
            targetYear: forecast.year,
            orderMonth: orderDate.getMonth() + 1,
            orderYear: orderDate.getFullYear(),
            supplier,
            client,
            subsidiary: forecast.subsidiary,
            section: forecast.section,
            status: orderStatuses[key]?.status || 'Pending',
            orderRef: orderStatuses[key]?.ref || ''
          };
        }
        plan[key].quantity += forecast.qty;
      }
    });

    return Object.values(plan).sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
  }, [data, products, demandSource, orderStatuses]);

  const availableProducts = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
    return Array.from(new Set(validPlan.map(p => p.productName))).sort();
  }, [mrpPlan, filterMonth, filterSupplier, filterClient, filterSubsidiary, filterSection]);

  const availableMonths = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
    return Array.from(new Set(validPlan.map(p => p.orderMonth.toString()))).sort((a: string, b: string) => parseInt(a) - parseInt(b));
  }, [mrpPlan, filterProduct, filterSupplier, filterClient, filterSubsidiary, filterSection]);

  const availableSuppliers = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
    const sups = new Set(validPlan.map(p => p.supplier || 'Unassigned'));
    return Array.from(sups).sort();
  }, [mrpPlan, filterProduct, filterMonth, filterClient, filterSubsidiary, filterSection]);

  const availableClients = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
    const clients = new Set(validPlan.map(p => p.client));
    return Array.from(clients).sort();
  }, [mrpPlan, filterProduct, filterMonth, filterSupplier, filterSubsidiary, filterSection]);

  const availableSubsidiaries = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
    const subs = new Set(validPlan.map(p => p.subsidiary || 'Unassigned'));
    return Array.from(subs).sort();
  }, [mrpPlan, filterProduct, filterMonth, filterSupplier, filterClient, filterSection]);

  const availableSections = useMemo(() => {
    const validPlan = mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      return true;
    });
    const sects = new Set(validPlan.map(p => p.section || 'Unknown'));
    return Array.from(sects).sort();
  }, [mrpPlan, filterProduct, filterMonth, filterSupplier, filterClient, filterSubsidiary]);

  useEffect(() => {
    if (!initialized && mrpPlan.length > 0) {
      setInitialized(true);
    }
  }, [mrpPlan, initialized]);

  const handleClearFilters = () => {
    setDemandSource('SOP');
    setFilterProduct([]);
    setFilterMonth([]);
    setFilterSupplier([]);
    setFilterClient([]);
    setFilterSubsidiary([]);
    setFilterSection([]);
  };

  const handleMarkOrdered = (id: string) => {
    setSelectedMrpId(id);
    setIsModalOpen(true);
  };

  const handleConfirmOrder = (poId: string) => {
    if (selectedMrpId && poId) {
      setOrderStatuses(prev => ({
        ...prev,
        [selectedMrpId]: { status: 'Ordered', ref: poId }
      }));
      setIsModalOpen(false);
      setSelectedMrpId(null);
    }
  };

  const filteredPlan = useMemo(() => {
    return mrpPlan.filter(row => {
      if (filterProduct.length > 0 && !filterProduct.includes(row.productName)) return false;
      if (filterMonth.length > 0 && !filterMonth.includes(row.orderMonth.toString())) return false;
      if (filterSupplier.length > 0 && !filterSupplier.includes(row.supplier || 'Unassigned')) return false;
      if (filterClient.length > 0 && !filterClient.includes(row.client)) return false;
      if (filterSubsidiary.length > 0 && !filterSubsidiary.includes(row.subsidiary || 'Unassigned')) return false;
      if (filterSection.length > 0 && !filterSection.includes(row.section || 'Unknown')) return false;
      return true;
    });
  }, [mrpPlan, filterProduct, filterMonth, filterSupplier, filterClient, filterSubsidiary, filterSection]);

  const totalQuantity = useMemo(() => {
    return filteredPlan.reduce((sum, row) => sum + row.quantity, 0);
  }, [filteredPlan]);

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    if (compareDate < today) {
      return (
        <span className="text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle size={14}/> Past Due ({dateStr})
        </span>
      );
    }
    return dateStr;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Calculator size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Material Requirements Planning (MRP)</h2>
          </div>
          <p className="text-slate-500">
            Automatically generated order plan based on forecasts, Bill of Materials (BOM), and Lead Times.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-slate-600 font-medium mr-2">
          <Filter size={18} /> Filters:
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Demand Source</label>
          <select 
            value={demandSource} 
            onChange={e => setDemandSource(e.target.value as any)}
            className="p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50 min-w-[150px]"
          >
            <option value="SOP">Working Forecast (S&OP)</option>
            <option value="BOOKED">Booked Orders Only</option>
            <option value="BOTH">S&OP + Booked Orders</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Product</label>
          <MultiSelect 
            options={availableProducts}
            selectedValues={filterProduct}
            onChange={setFilterProduct}
            placeholder="Select Products"
            className="min-w-[180px]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Order Month</label>
          <MultiSelect 
            options={availableMonths}
            selectedValues={filterMonth}
            onChange={setFilterMonth}
            placeholder="Select Months"
            className="min-w-[180px]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Supplier</label>
          <MultiSelect 
            options={availableSuppliers}
            selectedValues={filterSupplier}
            onChange={setFilterSupplier}
            placeholder="Select Suppliers"
            className="min-w-[180px]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Client</label>
          <MultiSelect 
            options={availableClients}
            selectedValues={filterClient}
            onChange={setFilterClient}
            placeholder="Select Clients"
            className="min-w-[180px]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Subsidiary</label>
          <MultiSelect 
            options={availableSubsidiaries}
            selectedValues={filterSubsidiary}
            onChange={setFilterSubsidiary}
            placeholder="Select Subsidiaries"
            className="min-w-[180px]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-slate-500 mb-1 uppercase">Section</label>
          <MultiSelect 
            options={availableSections}
            selectedValues={filterSection}
            onChange={setFilterSection}
            placeholder="Select Sections"
            className="min-w-[180px]"
          />
        </div>

        <button 
          onClick={handleClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-auto self-center"
        >
          Clear Filters
        </button>
      </div>

      <MaximizeWrapper title="Material Requirements Planning (MRP)" className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Order Date</th>
              <th className="p-4 font-semibold text-slate-600">Client</th>
              <th className="p-4 font-semibold text-slate-600">Item to Order</th>
              <th className="p-4 font-semibold text-slate-600">Supplier</th>
              <th className="p-4 font-semibold text-slate-600">Category</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Required Quantity</th>
              <th className="p-4 font-semibold text-slate-600">Order Ref</th>
              <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPlan.length > 0 ? (
              filteredPlan.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    {row.status === 'Ordered' ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14}/> Already Ordered
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        {formatDate(row.orderDate)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{row.client}</td>
                  <td className="p-4 font-medium text-slate-800">{row.productName}</td>
                  <td className="p-4 text-slate-600">{row.supplier}</td>
                  <td className="p-4 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                      {row.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-slate-700">
                    {row.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-sm">{row.orderRef || '-'}</td>
                  <td className="p-4 text-right">
                    {row.status === 'Pending' && !isReadOnly && (
                      <button 
                        onClick={() => handleMarkOrdered(row.id)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                      >
                        Ordered Recently
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No MRP data generated for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
          {filteredPlan.length > 0 && (
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={5} className="p-4 text-right font-bold text-slate-700">Total Required Quantity:</td>
                <td className="p-4 text-right font-mono font-bold text-blue-700">
                  {totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </MaximizeWrapper>

      {/* PO Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Select Purchase Order</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {purchaseOrders.length > 0 ? (
                <div className="space-y-2">
                  {purchaseOrders.map(po => (
                    <button
                      key={po.id}
                      onClick={() => handleConfirmOrder(po.id)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-800">{po.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          po.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                          po.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {po.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex justify-between">
                        <span>{po.supplier}</span>
                        <span>{new Date(po.orderDate).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No Purchase Orders available.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MRPScreen;
