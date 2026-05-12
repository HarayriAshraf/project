import React, { useMemo } from 'react';
import { ForecastRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, Banknote, Percent, Package } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
}

const ExecutiveDashboardScreen: React.FC<Props> = ({ data }) => {
  const summary = useMemo(() => {
    let revenue = 0;
    let gp = 0;
    let qty = 0;
    let npiRevenue = 0;
    let promoRevenue = 0;

    data.forEach(d => {
      if (d.status === 'Budget') return; // Exclude budget from totals
      revenue += d.sales;
      gp += d.gp;
      qty += d.qty;
      if (d.recordType === 'NPI') npiRevenue += d.sales;
      if (d.recordType === 'Promotion') promoRevenue += d.sales;
    });

    return {
      revenue,
      gp,
      qty,
      margin: revenue > 0 ? (gp / revenue) * 100 : 0,
      npiRevenue,
      promoRevenue,
      npiPercent: revenue > 0 ? (npiRevenue / revenue) * 100 : 0,
      promoPercent: revenue > 0 ? (promoRevenue / revenue) * 100 : 0,
    };
  }, [data]);

  const monthlyData = useMemo(() => {
    const monthsMap = new Map<string, { month: string, revenue: number, gp: number, npi: number, promo: number }>();
    
    data.forEach(d => {
      if (d.status === 'Budget') return; // Exclude budget from monthly trend
      const key = `${d.year}-${d.month.toString().padStart(2, '0')}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, { month: key, revenue: 0, gp: 0, npi: 0, promo: 0 });
      }
      const entry = monthsMap.get(key)!;
      entry.revenue += d.sales;
      entry.gp += d.gp;
      if (d.recordType === 'NPI') entry.npi += d.sales;
      if (d.recordType === 'Promotion') entry.promo += d.sales;
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `JOD ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `JOD ${(val / 1000).toFixed(1)}K`;
    return `JOD ${val.toFixed(0)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Executive KPI Dashboard</h1>
        <p className="text-slate-500">High-level overview of forecast performance, margins, and strategic initiatives.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Banknote size={18} />
            <span className="font-medium">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.revenue)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={18} />
            <span className="font-medium">Total Gross Profit</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.gp)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Percent size={18} />
            <span className="font-medium">Blended Margin</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.margin.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Package size={18} />
            <span className="font-medium">NPI & Promo Mix</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{(summary.npiPercent + summary.promoPercent).toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">
            NPI: {summary.npiPercent.toFixed(1)}% | Promo: {summary.promoPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MaximizeWrapper title="Monthly Sales & GP% Trend" className="h-96">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis yAxisId="left" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number, name: string) => [name === 'GP %' ? `${value.toFixed(1)}%` : formatCurrency(value), name]} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Total Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey={(d) => d.revenue > 0 ? (d.gp / d.revenue) * 100 : 0} name="GP %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Strategic Mix (Baseline vs NPI vs Promo)" className="h-96">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey={(d) => d.revenue - d.npi - d.promo} name="Baseline" stackId="a" fill="#94a3b8" />
                <Bar dataKey="promo" name="Promotion" stackId="a" fill="#f59e0b" />
                <Bar dataKey="npi" name="NPI" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>
    </div>
  );
};

export default ExecutiveDashboardScreen;
