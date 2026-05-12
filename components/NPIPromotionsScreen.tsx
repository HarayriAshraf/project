import React, { useMemo } from 'react';
import { ForecastRecord } from '../types';
import { Tag, TrendingUp, Package, Banknote } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
}

const NPIPromotionsScreen: React.FC<Props> = ({ data }) => {
  const npiData = useMemo(() => data.filter(d => d.recordType === 'NPI'), [data]);
  const promoData = useMemo(() => data.filter(d => d.recordType === 'Promotion'), [data]);

  const calculateTotals = (records: ForecastRecord[]) => {
    return records.reduce((acc, curr) => ({
      sales: acc.sales + curr.sales,
      qty: acc.qty + curr.qty,
      gp: acc.gp + curr.gp
    }), { sales: 0, qty: 0, gp: 0 });
  };

  const npiTotals = calculateTotals(npiData);
  const promoTotals = calculateTotals(promoData);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">NPI & Promotions</h2>
          <p className="text-slate-500">Track New Product Introductions and Promotional Campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPI Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-blue-50 flex items-center gap-3">
            <Package className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-slate-800">New Product Introductions (NPI)</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Total NPI Revenue</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(npiTotals.sales)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Total NPI Volume</div>
                <div className="text-lg font-bold text-slate-800">{formatNumber(npiTotals.qty)} MT</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Total NPI GP</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(npiTotals.gp)}</div>
              </div>
            </div>

            <MaximizeWrapper title="New Product Introductions (NPI)" className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 text-right">Volume</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {npiData.length > 0 ? npiData.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                      <td className="px-4 py-3 text-slate-600">{item.client}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatNumber(item.qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(item.sales)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No NPI records found for this cycle.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </MaximizeWrapper>
          </div>
        </div>

        {/* Promotions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-emerald-50 flex items-center gap-3">
            <Tag className="text-emerald-600" size={24} />
            <h3 className="text-lg font-semibold text-slate-800">Promotional Campaigns</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Promo Revenue</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(promoTotals.sales)}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Promo Volume</div>
                <div className="text-lg font-bold text-slate-800">{formatNumber(promoTotals.qty)} MT</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Promo GP</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(promoTotals.gp)}</div>
              </div>
            </div>

            <MaximizeWrapper title="Promotional Campaigns" className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 text-right">Volume</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {promoData.length > 0 ? promoData.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                      <td className="px-4 py-3 text-slate-600">{item.client}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatNumber(item.qty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatCurrency(item.sales)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No promotional records found for this cycle.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </MaximizeWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NPIPromotionsScreen;
