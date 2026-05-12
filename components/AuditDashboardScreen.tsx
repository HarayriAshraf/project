import React, { useState, useMemo } from 'react';
import { AuditLog, User, ForecastRecord, ForecastStatus } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Minus, FileSpreadsheet, Download } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';
import * as XLSX from 'xlsx';

interface AuditDashboardScreenProps {
  auditLogs: AuditLog[];
  user: User | null;
  userRole?: string;
  data?: ForecastRecord[];
  onApprove?: (log: AuditLog) => void;
  onDecline?: (log: AuditLog) => void;
}

const AuditDashboardScreen: React.FC<AuditDashboardScreenProps> = ({ auditLogs, user, userRole, data = [], onApprove, onDecline }) => {
  const [filterSubsidiary, setFilterSubsidiary] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSalesRep, setFilterSalesRep] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Extract unique values for filters
  const subsidiaries = Array.from(new Set(auditLogs.map(log => log.subsidiary).filter(Boolean))) as string[];
  const sections = Array.from(new Set(auditLogs.map(log => log.section).filter(Boolean))) as string[];
  const salesReps = Array.from(new Set(auditLogs.map(log => log.salesRep).filter(Boolean))) as string[];
  const clients = Array.from(new Set(auditLogs.map(log => log.client).filter(Boolean))) as string[];
  const products = Array.from(new Set(auditLogs.map(log => log.product).filter(Boolean))) as string[];
  const months = Array.from(new Set(auditLogs.map(log => log.month?.toString()).filter(Boolean))) as string[];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Role-based filtering
      if (user?.role === 'Manager' && user.subsidiary && log.subsidiary !== user.subsidiary) return false;

      if (filterSubsidiary && log.subsidiary !== filterSubsidiary) return false;
      if (filterSection && log.section !== filterSection) return false;
      if (filterSalesRep && log.salesRep !== filterSalesRep) return false;
      if (filterClient && log.client !== filterClient) return false;
      if (filterProduct && log.product !== filterProduct) return false;
      if (filterMonth && log.month?.toString() !== filterMonth) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, filterSubsidiary, filterSalesRep, filterClient, filterProduct, filterMonth, user]);

  const handleExportExcel = () => {
    const exportData = filteredLogs.map(log => {
      const qtyDiff = (log.newQty || 0) - (log.previousQty || 0);
      const salesDiff = (log.newSales || 0) - (log.previousSales || 0);
      const gpDiff = (log.newGP || 0) - (log.previousGP || 0);

      return {
        'Date/Time': new Date(log.timestamp).toLocaleString(),
        'Sales Rep': log.salesRep || log.userEmail,
        'Subsidiary': log.subsidiary || '-',
        'Section': log.section || '-',
        'Client': log.client || '-',
        'Product': log.product,
        'Previous Period': log.previousMonth && log.previousYear ? `${log.previousYear}-${log.previousMonth.toString().padStart(2, '0')}` : '-',
        'New Period': log.month ? `${log.year}-${log.month.toString().padStart(2, '0')}` : '-',
        'Qty Change': qtyDiff,
        'Previous Qty': log.previousQty || 0,
        'New Qty': log.newQty || 0,
        'Sales Change': salesDiff,
        'Profit Change': gpDiff,
        'Reason': log.reasonCode,
        'Details': log.details
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trail');
    XLSX.writeFile(workbook, 'Forecast_Audit_Trail.xlsx');
  };

  const summary = useMemo(() => {
    let qtyChange = 0;
    let salesChange = 0;
    let gpChange = 0;
    let convertedQty = 0;
    let convertedSales = 0;

    filteredLogs.forEach(log => {
      const prevQty = log.previousQty || 0;
      const newQty = log.newQty || 0;
      const prevSales = log.previousSales || 0;
      const newSales = log.newSales || 0;
      const prevGP = log.previousGP || 0;
      const newGP = log.newGP || 0;

      if (log.reasonCode === 'Already Booked') {
        // If it was removed because it's booked, the change is negative, so we take the absolute value
        convertedQty += Math.abs(newQty - prevQty);
        convertedSales += Math.abs(newSales - prevSales);
      } else {
        qtyChange += (newQty - prevQty);
        salesChange += (newSales - prevSales);
        gpChange += (newGP - prevGP);
      }
    });

    return { qtyChange, salesChange, gpChange, convertedQty, convertedSales };
  }, [filteredLogs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  };

  const renderChangeIndicator = (change: number, isCurrency = false) => {
    if (change === 0) return <span className="text-slate-400 flex items-center gap-1"><Minus size={14} /> {isCurrency ? formatCurrency(0) : 0}</span>;
    if (change > 0) return <span className="text-emerald-600 flex items-center gap-1"><ArrowUpRight size={14} /> +{isCurrency ? formatCurrency(change) : formatNumber(change)}</span>;
    return <span className="text-rose-600 flex items-center gap-1"><ArrowDownRight size={14} /> {isCurrency ? formatCurrency(change) : formatNumber(change)}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forecast Audit Trail</h1>
          <p className="text-slate-500">Detailed view of changes made to forecasts by sales representatives</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium">
            <FileSpreadsheet size={20} />
            {filteredLogs.length} Records Found
          </div>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download size={20} />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">Net Quantity Change</div>
          <div className="text-2xl font-bold">
            {renderChangeIndicator(summary.qtyChange)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">Net Sales Change</div>
          <div className="text-2xl font-bold">
            {renderChangeIndicator(summary.salesChange, true)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">Net Profit Change</div>
          <div className="text-2xl font-bold">
            {renderChangeIndicator(summary.gpChange, true)}
          </div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-200">
          <div className="text-sm text-emerald-700 mb-1">Converted to Booked</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatNumber(summary.convertedQty)} MT
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {formatCurrency(summary.convertedSales)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium mr-2">
          <Filter size={18} /> Filters:
        </div>
        
        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterSubsidiary}
          onChange={(e) => setFilterSubsidiary(e.target.value)}
        >
          <option value="">All Subsidiaries</option>
          {subsidiaries.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>

        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
        >
          <option value="">All Sections</option>
          {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
        </select>

        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterSalesRep}
          onChange={(e) => setFilterSalesRep(e.target.value)}
        >
          <option value="">All Sales Reps</option>
          {salesReps.map(rep => <option key={rep} value={rep}>{rep}</option>)}
        </select>

        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
        >
          <option value="">All Clients</option>
          {clients.map(client => <option key={client} value={client}>{client}</option>)}
        </select>

        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
        >
          <option value="">All Products</option>
          {products.map(prod => <option key={prod} value={prod}>{prod}</option>)}
        </select>

        <select 
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {months.map(m => <option key={m} value={m}>Month {m}</option>)}
        </select>

        <button 
          onClick={() => {
            setFilterSubsidiary('');
            setFilterSalesRep('');
            setFilterClient('');
            setFilterProduct('');
            setFilterMonth('');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-auto"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <MaximizeWrapper title="Audit Trail" className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="p-3 font-medium border-b">Date/Time</th>
                <th className="p-3 font-medium border-b">Sales Rep</th>
                <th className="p-3 font-medium border-b">Subsidiary</th>
                <th className="p-3 font-medium border-b">Section</th>
                <th className="p-3 font-medium border-b">Client</th>
                <th className="p-3 font-medium border-b">Product</th>
                <th className="p-3 font-medium border-b">Period</th>
                <th className="p-3 font-medium border-b text-right">Qty Change</th>
                <th className="p-3 font-medium border-b text-right">Sales Change</th>
                <th className="p-3 font-medium border-b text-right">Profit Change</th>
                <th className="p-3 font-medium border-b">Reason</th>
                {(userRole === 'Manager' || userRole === 'Admin') && (
                  <th className="p-3 font-medium border-b text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const qtyDiff = (log.newQty || 0) - (log.previousQty || 0);
                  const salesDiff = (log.newSales || 0) - (log.previousSales || 0);
                  const gpDiff = (log.newGP || 0) - (log.previousGP || 0);
                  
                  // A log is pending if the record it modifies is currently in DRAFT status
                  const record = data.find(r => r.id === log.recordId);
                  const isPending = record?.workflowStatus === ForecastStatus.DRAFT && 
                                    !log.reasonCode.includes('Approved') && 
                                    !log.reasonCode.includes('Declined');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 font-medium text-slate-900">{log.salesRep || log.userEmail}</td>
                      <td className="p-3 text-slate-600">{log.subsidiary || '-'}</td>
                      <td className="p-3 text-slate-600">{log.section || '-'}</td>
                      <td className="p-3 text-slate-600">{log.client || '-'}</td>
                      <td className="p-3 text-slate-600">{log.product}</td>
                      <td className="p-3 text-slate-600">
                        {log.previousMonth && log.previousYear && (log.previousMonth !== log.month || log.previousYear !== log.year) ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-400 line-through">{log.previousYear}-{log.previousMonth.toString().padStart(2, '0')}</span>
                            <span className="font-medium text-blue-600">{log.year}-{log.month?.toString().padStart(2, '0')}</span>
                          </div>
                        ) : (
                          log.month ? `${log.year}-${log.month.toString().padStart(2, '0')}` : '-'
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        <div className="flex flex-col items-end">
                          {renderChangeIndicator(qtyDiff)}
                          <span className="text-xs text-slate-400 font-normal">{log.previousQty || 0} → {log.newQty || 0}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        <div className="flex flex-col items-end">
                          {renderChangeIndicator(salesDiff, true)}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        <div className="flex flex-col items-end">
                          {renderChangeIndicator(gpDiff, true)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.reasonCode.includes('Approved') ? 'bg-green-100 text-green-700' :
                          log.reasonCode.includes('Declined') ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.reasonCode}
                        </span>
                      </td>
                      {(userRole === 'Manager' || userRole === 'Admin') && (
                        <td className="p-3 text-right">
                          {isPending && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => onApprove && onApprove(log)}
                                className="px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onDecline && onDecline(log)}
                                className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No audit logs found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </MaximizeWrapper>
    </div>
  );
};

export default AuditDashboardScreen;
