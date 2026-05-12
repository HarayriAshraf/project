import React, { useState, useMemo } from "react";
import { ForecastRecord, AuditLog, Product } from "../types";
import { Truck, Edit2, Save, XCircle, Calendar, Filter } from "lucide-react";

interface Props {
  data: ForecastRecord[];
  products: Product[];
  onUpdateData: (records: ForecastRecord[], auditLogs: AuditLog[]) => void;
  currentUserEmail: string;
}

const SupplyReviewScreen: React.FC<Props> = ({ data, products, onUpdateData, currentUserEmail }) => {
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterPeriod, setFilterPeriod] = useState<string>("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterOrderDate, setFilterOrderDate] = useState<string>("");
  const [filterSubsidiary, setFilterSubsidiary] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const getOrderDate = (record: ForecastRecord) => {
    const product = products.find(p => p.name === record.product);
    const leadTimeWeeks = product?.leadTimeWeeks || 0;
    const forecastDate = new Date(record.year, record.month - 1, 1);
    forecastDate.setDate(forecastDate.getDate() - (leadTimeWeeks * 7));
    return forecastDate.toISOString().split('T')[0];
  };

  const bookedOrders = useMemo(() => {
    return data
      .filter((d) => d.status === "Booked")
      .filter(d => !filterClient || d.client === filterClient)
      .filter(d => !filterProduct || d.product === filterProduct)
      .filter(d => !filterSupplier || d.supplier === filterSupplier)
      .filter(d => !filterSubsidiary || d.subsidiary === filterSubsidiary)
      .filter(d => !filterSection || d.section === filterSection)
      .filter(d => {
        if (!filterPeriod) return true;
        const p = `${d.invoicingYear || d.year}-${String(d.invoicingMonth || d.month).padStart(2, '0')}`;
        return p === filterPeriod;
      })
      .filter(d => !filterOrderDate || getOrderDate(d) === filterOrderDate)
      .filter(d => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          d.client.toLowerCase().includes(term) ||
          d.product.toLowerCase().includes(term) ||
          (d.supplier && d.supplier.toLowerCase().includes(term)) ||
          (d.orderReference && d.orderReference.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        const yearDiff = (b.invoicingYear || b.year) - (a.invoicingYear || a.year);
        if (yearDiff !== 0) return yearDiff;
        return (b.invoicingMonth || b.month) - (a.invoicingMonth || a.month);
      });
  }, [data, filterClient, filterProduct, filterSupplier, filterPeriod, filterOrderDate, products]);

  const availableClients = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => d.client))).sort(), [data]);
  const availableProducts = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => d.product))).sort(), [data]);
  const availableSuppliers = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => d.supplier).filter(Boolean) as string[])).sort(), [data]);
  const availableSubsidiaries = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => d.subsidiary).filter(Boolean) as string[])).sort(), [data]);
  const availableSections = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => d.section).filter(Boolean) as string[])).sort(), [data]);
  const availablePeriods = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => `${d.invoicingYear || d.year}-${String(d.invoicingMonth || d.month).padStart(2, '0')}`))).sort(), [data]);
  const availableOrderDates = useMemo(() => Array.from(new Set(data.filter(d => d.status === "Booked").map(d => getOrderDate(d)))).sort(), [data, products]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInvMonth, setEditInvMonth] = useState<number>(0);
  const [editInvYear, setEditInvYear] = useState<number>(0);

  const startEdit = (record: ForecastRecord) => {
    setEditingId(record.id);
    setEditInvMonth(record.invoicingMonth || record.month);
    setEditInvYear(record.invoicingYear || record.year);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = () => {
    if (!editingId) return;
    const record = data.find((d) => d.id === editingId);
    if (!record) return;

    const updatedRecord: ForecastRecord = {
      ...record,
      invoicingMonth: editInvMonth,
      invoicingYear: editInvYear,
    };

    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
      recordId: record.id,
      product: record.product,
      actionType: "AMEND",
      reasonCode: "Supply Review Update",
      details: `Updated Invoicing to ${editInvYear}-${editInvMonth}`,
      client: record.client,
      subsidiary: record.subsidiary,
      salesRep: record.salesPerson,
      month: record.month,
      year: record.year,
      previousQty: record.qty,
      newQty: record.qty,
      previousSales: record.sales,
      newSales: record.sales,
      previousGP: record.gp,
      newGP: record.gp,
    };

    const newData = data.map((d) => (d.id === editingId ? updatedRecord : d));
    onUpdateData(newData, [log]);
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Supply Review
          </h1>
          <p className="text-slate-500 mt-1">
            Manage invoicing periods for booked orders.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-slate-600 font-medium w-full mb-2">
          <Filter size={18} /> Filters
        </div>
        <div className="w-full md:w-auto flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Search client, product, supplier, ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Subsidiary</label>
          <select value={filterSubsidiary} onChange={e => setFilterSubsidiary(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Subsidiaries</option>
            {availableSubsidiaries.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Sections</option>
            {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Client</label>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Clients</option>
            {availableClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Product</label>
          <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Products</option>
            {availableProducts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier</label>
          <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Suppliers</option>
            {availableSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Invoicing Period</label>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Periods</option>
            {availablePeriods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Order Date</label>
          <select value={filterOrderDate} onChange={e => setFilterOrderDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Dates</option>
            {availableOrderDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4 border-b border-slate-200">Order Ref</th>
                <th className="p-4 border-b border-slate-200">Client</th>
                <th className="p-4 border-b border-slate-200">Product</th>
                <th className="p-4 border-b border-slate-200">Supplier</th>
                <th className="p-4 border-b border-slate-200 text-right">Qty (MT)</th>
                <th className="p-4 border-b border-slate-200">Invoicing Period</th>
                <th className="p-4 border-b border-slate-200">Order Date</th>
                <th className="p-4 border-b border-slate-200 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bookedOrders.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {row.orderReference || "-"}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{row.client}</td>
                  <td className="p-4 text-slate-700">{row.product}</td>
                  <td className="p-4 text-slate-700">{row.supplier || "-"}</td>
                  <td className="p-4 text-right font-mono text-slate-700">
                    {row.qty.toLocaleString()}
                  </td>
                  <td className="p-4">
                    {editingId === row.id ? (
                      <div className="flex gap-2 w-full max-w-[200px]">
                        <select
                          value={editInvMonth}
                          onChange={(e) => setEditInvMonth(parseInt(e.target.value, 10))}
                          className="w-1/2 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                          <option value={0}>Month</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={editInvYear}
                          onChange={(e) => setEditInvYear(parseInt(e.target.value, 10))}
                          className="w-1/2 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                          <option value={0}>Year</option>
                          {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium text-xs flex items-center gap-1 w-fit">
                        <Calendar size={12} />
                        {row.invoicingYear || row.year}-{String(row.invoicingMonth || row.month).padStart(2, "0")}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {getOrderDate(row)}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === row.id ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={handleSave}
                          className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
                          title="Cancel"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(row)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                        title="Edit Invoicing Period"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {bookedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    No booked orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplyReviewScreen;
