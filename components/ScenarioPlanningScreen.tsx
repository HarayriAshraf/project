import React, { useState, useMemo } from 'react';
import { ForecastRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sliders, Activity, Banknote } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
  availableCycles: string[];
  currentCycle: string;
}

const ScenarioPlanningScreen: React.FC<Props> = ({ data, availableCycles, currentCycle }) => {
  const [volumeAdj, setVolumeAdj] = useState<number>(0);
  const [priceAdj, setPriceAdj] = useState<number>(0);
  const [costAdj, setCostAdj] = useState<number>(0);

  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [fromPeriod, setFromPeriod] = useState<string>('All');
  const [toPeriod, setToPeriod] = useState<string>('All');

  const clients = useMemo(() => {
    const validData = data.filter(d => {
      const p = `${d.year}-${String(d.month).padStart(2, '0')}`;
      if (selectedProduct !== 'All' && d.product !== selectedProduct) return false;
      if (fromPeriod !== 'All' && p < fromPeriod) return false;
      if (toPeriod !== 'All' && p > toPeriod) return false;
      return true;
    });
    return ['All', ...Array.from(new Set(validData.map(d => d.client)))].sort();
  }, [data, selectedProduct, fromPeriod, toPeriod]);

  const products = useMemo(() => {
    const validData = data.filter(d => {
      const p = `${d.year}-${String(d.month).padStart(2, '0')}`;
      if (selectedClient !== 'All' && d.client !== selectedClient) return false;
      if (fromPeriod !== 'All' && p < fromPeriod) return false;
      if (toPeriod !== 'All' && p > toPeriod) return false;
      return true;
    });
    return ['All', ...Array.from(new Set(validData.map(d => d.product)))].sort();
  }, [data, selectedClient, fromPeriod, toPeriod]);

  const periods = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedClient !== 'All' && d.client !== selectedClient) return false;
      if (selectedProduct !== 'All' && d.product !== selectedProduct) return false;
      return true;
    });
    const p = new Set(validData.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`));
    return ['All', ...Array.from(p)].sort();
  }, [data, selectedClient, selectedProduct]);

  const clearFilters = () => {
    setSelectedClient('All');
    setSelectedProduct('All');
    setFromPeriod('All');
    setToPeriod('All');
  };

  const currentYear = useMemo(() => {
    const yearMatch = currentCycle.match(/\b(20\d{2})\b/);
    if (yearMatch) return parseInt(yearMatch[1]);
    
    // Fallback: find the most common year in this cycle's data
    const cycleRecords = data.filter(d => d.version === currentCycle);
    if (cycleRecords.length > 0) {
      const yearCounts = cycleRecords.reduce((acc, rec) => {
        acc[rec.year] = (acc[rec.year] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      let maxYear = new Date().getFullYear();
      let maxCount = 0;
      for (const [yearStr, count] of Object.entries(yearCounts) as [string, number][]) {
        if (count > maxCount) {
          maxCount = count;
          maxYear = parseInt(yearStr);
        }
      }
      return maxYear;
    }
    return new Date().getFullYear();
  }, [currentCycle, data]);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `JOD ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `JOD ${(val / 1000).toFixed(1)}K`;
    return `JOD ${val.toFixed(0)}`;
  };

  const currentCycleData = useMemo(() => data.filter(d => d.version === currentCycle), [data, currentCycle]);
  const budgetData = useMemo(() => data.filter(d => 
    (d.status === 'Budget' || d.version === 'Budget' || d.version?.includes('Budget')) && 
    d.year === currentYear && 
    d.status !== 'Booked' && 
    d.status !== 'Forecasted'
  ), [data, currentYear]);

  const scenarioData = useMemo(() => {
    let totalBaseRevenue = 0;
    let totalBaseGP = 0;
    let totalBaseQty = 0;

    let totalAdjRevenue = 0;
    let totalAdjGP = 0;
    let totalAdjQty = 0;

    let filteredBaseRevenue = 0;
    let filteredBaseGP = 0;
    let filteredBaseQty = 0;

    let filteredAdjRevenue = 0;
    let filteredAdjGP = 0;
    let filteredAdjQty = 0;

    let totalBudgetRevenue = 0;
    let totalBudgetGP = 0;

    // Calculate Budget Totals
    budgetData.forEach(d => {
      totalBudgetRevenue += d.sales;
      totalBudgetGP += d.gp;
    });

    currentCycleData.forEach(d => {
      totalBaseRevenue += d.sales;
      totalBaseGP += d.gp;
      totalBaseQty += d.qty;

      // Check if this record matches the current filters
      let matchesFilter = true;
      if (selectedClient !== 'All' && d.client !== selectedClient) matchesFilter = false;
      if (selectedProduct !== 'All' && d.product !== selectedProduct) matchesFilter = false;
      
      const periodStr = `${d.year}-${String(d.month).padStart(2, '0')}`;
      if (fromPeriod !== 'All' && periodStr < fromPeriod) matchesFilter = false;
      if (toPeriod !== 'All' && periodStr > toPeriod) matchesFilter = false;

      if (matchesFilter) {
        filteredBaseRevenue += d.sales;
        filteredBaseGP += d.gp;
        filteredBaseQty += d.qty;

        // Apply adjustments
        const newQty = d.qty * (1 + volumeAdj / 100);
        const newSales = d.sales * (1 + volumeAdj / 100) * (1 + priceAdj / 100);
        const newCost = (d.sales - d.gp) * (1 + volumeAdj / 100) * (1 + costAdj / 100);
        const newGrossProfit = newSales - newCost;

        filteredAdjRevenue += newSales;
        filteredAdjGP += newGrossProfit;
        filteredAdjQty += newQty;

        totalAdjRevenue += newSales;
        totalAdjGP += newGrossProfit;
        totalAdjQty += newQty;
      } else {
        // No adjustments, just add base
        totalAdjRevenue += d.sales;
        totalAdjGP += d.gp;
        totalAdjQty += d.qty;
      }
    });

    return {
      totalBase: { revenue: totalBaseRevenue, gp: totalBaseGP, qty: totalBaseQty, margin: totalBaseRevenue ? (totalBaseGP / totalBaseRevenue) * 100 : 0 },
      totalAdjusted: { revenue: totalAdjRevenue, gp: totalAdjGP, qty: totalAdjQty, margin: totalAdjRevenue ? (totalAdjGP / totalAdjRevenue) * 100 : 0 },
      filteredBase: { revenue: filteredBaseRevenue, gp: filteredBaseGP, qty: filteredBaseQty, margin: filteredBaseRevenue ? (filteredBaseGP / filteredBaseRevenue) * 100 : 0 },
      filteredAdjusted: { revenue: filteredAdjRevenue, gp: filteredAdjGP, qty: filteredAdjQty, margin: filteredAdjRevenue ? (filteredAdjGP / filteredAdjRevenue) * 100 : 0 },
      budget: { revenue: totalBudgetRevenue, gp: totalBudgetGP }
    };
  }, [currentCycleData, budgetData, selectedClient, selectedProduct, fromPeriod, toPeriod, volumeAdj, priceAdj, costAdj]);

  const chartData = [
    {
      name: `${currentYear} Budget`,
      Revenue: scenarioData.budget.revenue,
      'Gross Profit': scenarioData.budget.gp
    },
    {
      name: `${currentCycle} Base`,
      Revenue: scenarioData.totalBase.revenue,
      'Gross Profit': scenarioData.totalBase.gp
    },
    {
      name: 'Adjusted Scenario',
      Revenue: scenarioData.totalAdjusted.revenue,
      'Gross Profit': scenarioData.totalAdjusted.gp
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sensitivity Analysis (What-If Analysis)</h1>
        <p className="text-slate-500">Model the impact of volume, price, and cost changes on revenue and margins based on current S&OP Forecast figures.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">From Period</label>
          <select 
            value={fromPeriod} 
            onChange={(e) => setFromPeriod(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">To Period</label>
          <select 
            value={toPeriod} 
            onChange={(e) => setToPeriod(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
          <select 
            value={selectedClient} 
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
          <select 
            value={selectedProduct} 
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-none">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-800 font-bold mb-6">
            <Sliders size={20} />
            Global Adjustments
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Demand Volume</label>
                <span className={`text-sm font-bold ${volumeAdj > 0 ? 'text-emerald-600' : volumeAdj < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {volumeAdj > 0 ? '+' : ''}{volumeAdj}%
                </span>
              </div>
              <input 
                type="range" 
                min="-50" max="50" step="1" 
                value={volumeAdj} 
                onChange={(e) => setVolumeAdj(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Selling Price</label>
                <span className={`text-sm font-bold ${priceAdj > 0 ? 'text-emerald-600' : priceAdj < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {priceAdj > 0 ? '+' : ''}{priceAdj}%
                </span>
              </div>
              <input 
                type="range" 
                min="-50" max="50" step="1" 
                value={priceAdj} 
                onChange={(e) => setPriceAdj(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Supplier Cost</label>
                <span className={`text-sm font-bold ${costAdj < 0 ? 'text-emerald-600' : costAdj > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {costAdj > 0 ? '+' : ''}{costAdj}%
                </span>
              </div>
              <input 
                type="range" 
                min="-50" max="50" step="1" 
                value={costAdj} 
                onChange={(e) => setCostAdj(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => { setVolumeAdj(0); setPriceAdj(0); setCostAdj(0); }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Reset Scenario
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="text-sm text-slate-500 mb-1">Adjusted Revenue</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(scenarioData.filteredAdjusted.revenue)}</div>
            <div className={`text-sm font-medium flex items-center gap-1 ${scenarioData.filteredAdjusted.revenue >= scenarioData.filteredBase.revenue ? 'text-emerald-600' : 'text-red-600'}`}>
              <Activity size={16} />
              {scenarioData.filteredAdjusted.revenue >= scenarioData.filteredBase.revenue ? '+' : ''}
              {formatCurrency(scenarioData.filteredAdjusted.revenue - scenarioData.filteredBase.revenue)} vs Base
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="text-sm text-slate-500 mb-1">Adjusted Gross Profit</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(scenarioData.filteredAdjusted.gp)}</div>
            <div className={`text-sm font-medium flex items-center gap-1 ${scenarioData.filteredAdjusted.gp >= scenarioData.filteredBase.gp ? 'text-emerald-600' : 'text-red-600'}`}>
              <Banknote size={16} />
              {scenarioData.filteredAdjusted.gp >= scenarioData.filteredBase.gp ? '+' : ''}
              {formatCurrency(scenarioData.filteredAdjusted.gp - scenarioData.filteredBase.gp)} vs Base
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="text-sm text-slate-500 mb-1">Adjusted Margin %</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{scenarioData.filteredAdjusted.margin.toFixed(1)}%</div>
            <div className={`text-sm font-medium ${scenarioData.filteredAdjusted.margin >= scenarioData.filteredBase.margin ? 'text-emerald-600' : 'text-red-600'}`}>
              {scenarioData.filteredAdjusted.margin >= scenarioData.filteredBase.margin ? '+' : ''}
              {(scenarioData.filteredAdjusted.margin - scenarioData.filteredBase.margin).toFixed(1)}% vs Base ({scenarioData.filteredBase.margin.toFixed(1)}%)
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <div className="text-sm text-slate-500 mb-1">Adjusted Volume</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{scenarioData.filteredAdjusted.qty.toLocaleString()}</div>
            <div className={`text-sm font-medium ${scenarioData.filteredAdjusted.qty >= scenarioData.filteredBase.qty ? 'text-emerald-600' : 'text-red-600'}`}>
              {scenarioData.filteredAdjusted.qty >= scenarioData.filteredBase.qty ? '+' : ''}
              {(scenarioData.filteredAdjusted.qty - scenarioData.filteredBase.qty).toLocaleString()} vs Base
            </div>
          </div>
        </div>
      </div>

      <MaximizeWrapper title="Total Company: Base vs Scenario vs Budget" className="mt-4">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 14, fontWeight: 500 }} />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MaximizeWrapper>
    </div>
  );
};

export default ScenarioPlanningScreen;
