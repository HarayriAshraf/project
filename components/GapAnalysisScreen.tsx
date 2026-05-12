import React, { useState, useMemo } from 'react';
import { ForecastRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Line } from 'recharts';
import { Target, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
  availableCycles: string[];
  currentCycle: string;
}

const getStats = (arr: number[]) => {
  if (!arr.length) return { mean: 0, stdDev: 0, p10: 0, p50: 0, p90: 0, cv: 0, outlierPercent: 0, trimmedCount: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  const getP = (p: number) => {
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (lower === upper) return sorted[lower];
    if (upper >= sorted.length) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };
  const p10 = getP(0.10);
  const p25 = getP(0.25);
  const p50 = getP(0.50);
  const p75 = getP(0.75);
  const p90 = getP(0.90);
  
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : stdDev / mean;

  const iqr = p75 - p25;
  const lowerBound = p25 - 1.5 * iqr;
  const upperBound = p75 + 1.5 * iqr;
  const outliers = sorted.filter(v => v < lowerBound || v > upperBound);
  const outlierPercent = (outliers.length / sorted.length) * 100;

  return { mean, stdDev, p10, p50, p90, cv, outlierPercent, count: arr.length, trimmedCount: arr.length - outliers.length };
};

const GapAnalysisScreen: React.FC<Props> = ({ data, availableCycles, currentCycle }) => {
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('All');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('All');
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('All');
  
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  
  const [baseCycle, setBaseCycle] = useState<string>('Budget');
  const [compareCycle, setCompareCycle] = useState<string>(currentCycle);

  const getFilteredOptions = (fieldKey: keyof ForecastRecord, excludeFilter: string) => {
    const filtered = data.filter(d => {
      if (excludeFilter !== 'subsidiary' && selectedSubsidiary !== 'All' && d.subsidiary !== selectedSubsidiary) return false;
      if (excludeFilter !== 'salesPerson' && selectedSalesRep !== 'All' && d.salesPerson !== selectedSalesRep) return false;
      if (excludeFilter !== 'client' && selectedClient !== 'All' && d.client !== selectedClient) return false;
      if (excludeFilter !== 'product' && selectedProduct !== 'All' && d.product !== selectedProduct) return false;
      if (excludeFilter !== 'category' && selectedCategory !== 'All' && d.category !== selectedCategory) return false;
      if (excludeFilter !== 'supplier' && selectedSupplier !== 'All' && d.supplier !== selectedSupplier) return false;
      if (excludeFilter !== 'month' && selectedMonths.length > 0 && !selectedMonths.includes(String(d.month))) return false;
      if (excludeFilter !== 'year' && selectedYear !== 'All' && String(d.year) !== selectedYear) return false;
      return true;
    });
    const options = Array.from(new Set(filtered.map(d => d[fieldKey]).filter(val => val != null)));
    if (fieldKey === 'month' || fieldKey === 'year') {
      return (options as number[]).sort((a, b) => a - b).map(String);
    }
    return (options as string[]).sort();
  };

  const subsidiaries = useMemo(() => ['All', ...getFilteredOptions('subsidiary', 'subsidiary')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const salesReps = useMemo(() => ['All', ...getFilteredOptions('salesPerson', 'salesPerson')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const clients = useMemo(() => ['All', ...getFilteredOptions('client', 'client')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const products = useMemo(() => ['All', ...getFilteredOptions('product', 'product')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const categories = useMemo(() => ['All', ...getFilteredOptions('category', 'category')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const suppliers = useMemo(() => ['All', ...getFilteredOptions('supplier', 'supplier')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const months = useMemo(() => getFilteredOptions('month', 'month'), [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);
  const years = useMemo(() => ['All', ...getFilteredOptions('year', 'year')], [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedSubsidiary !== 'All' && d.subsidiary !== selectedSubsidiary) return false;
      if (selectedSalesRep !== 'All' && d.salesPerson !== selectedSalesRep) return false;
      if (selectedClient !== 'All' && d.client !== selectedClient) return false;
      if (selectedProduct !== 'All' && d.product !== selectedProduct) return false;
      if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
      if (selectedSupplier !== 'All' && d.supplier !== selectedSupplier) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(String(d.month))) return false;
      if (selectedYear !== 'All' && String(d.year) !== selectedYear) return false;
      return true;
    });
  }, [data, selectedSubsidiary, selectedSalesRep, selectedClient, selectedProduct, selectedCategory, selectedSupplier, selectedMonths, selectedYear]);

  const formatCurrency = (val: number) => {
    if (Math.abs(val) >= 1000000) return `JOD ${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `JOD ${(val / 1000).toFixed(1)}K`;
    return `JOD ${val.toFixed(0)}`;
  };

  const gapData = useMemo(() => {
    const productMap = new Map<string, { 
      product: string, 
      forecastSales: number, forecastQty: number, forecastGP: number,
      budgetSales: number, budgetQty: number, budgetGP: number 
    }>();
    
    filteredData.forEach(d => {
      if (!productMap.has(d.product)) {
        productMap.set(d.product, { 
          product: d.product, 
          forecastSales: 0, forecastQty: 0, forecastGP: 0,
          budgetSales: 0, budgetQty: 0, budgetGP: 0
        });
      }
      const entry = productMap.get(d.product)!;
      
      if (d.version === baseCycle) {
        entry.budgetSales += d.sales;
        entry.budgetQty += d.qty;
        entry.budgetGP += d.gp;
      }
      if (d.version === compareCycle) {
        entry.forecastSales += d.sales;
        entry.forecastQty += d.qty;
        entry.forecastGP += d.gp;
      }
    });

    return Array.from(productMap.values()).map(p => {
      const budgetPrice = p.budgetQty > 0 ? p.budgetSales / p.budgetQty : 0;
      const forecastPrice = p.forecastQty > 0 ? p.forecastSales / p.forecastQty : 0;
      
      const budgetUnitGP = p.budgetQty > 0 ? p.budgetGP / p.budgetQty : 0;
      const forecastUnitGP = p.forecastQty > 0 ? p.forecastGP / p.forecastQty : 0;

      // Sales Variances
      const salesVolumeVariance = (p.forecastQty - p.budgetQty) * budgetPrice;
      const salesPriceVariance = (forecastPrice - budgetPrice) * p.forecastQty;
      const totalSalesVariance = p.forecastSales - p.budgetSales;

      // GP Variances
      const gpVolumeVariance = (p.forecastQty - p.budgetQty) * budgetUnitGP;
      const gpMarginVariance = (forecastUnitGP - budgetUnitGP) * p.forecastQty;
      const totalGPVariance = p.forecastGP - p.budgetGP;

      return {
        ...p,
        salesGap: totalSalesVariance,
        salesVolumeVariance,
        salesPriceVariance,
        gpGap: totalGPVariance,
        gpVolumeVariance,
        gpMarginVariance
      };
    }).sort((a, b) => a.salesGap - b.salesGap);
  }, [filteredData, baseCycle, compareCycle]);

  const totalBudgetSales = gapData.reduce((sum, item) => sum + item.budgetSales, 0);
  const totalForecastSales = gapData.reduce((sum, item) => sum + item.forecastSales, 0);
  const totalSalesGap = totalForecastSales - totalBudgetSales;

  const totalBudgetGP = gapData.reduce((sum, item) => sum + item.budgetGP, 0);
  const totalForecastGP = gapData.reduce((sum, item) => sum + item.forecastGP, 0);
  const totalGPGap = totalForecastGP - totalBudgetGP;

  const totalSalesVolumeVar = gapData.reduce((sum, item) => sum + item.salesVolumeVariance, 0);
  const totalSalesPriceVar = gapData.reduce((sum, item) => sum + item.salesPriceVariance, 0);

  const totalGPVolumeVar = gapData.reduce((sum, item) => sum + item.gpVolumeVariance, 0);
  const totalGPMarginVar = gapData.reduce((sum, item) => sum + item.gpMarginVariance, 0);

  const priceStats = useMemo(() => {
    const basePrices = filteredData.filter(d => d.version === baseCycle && d.qty > 0).map(d => d.sales / d.qty);
    const comparePrices = filteredData.filter(d => d.version === compareCycle && d.qty > 0).map(d => d.sales / d.qty);
    return {
      base: getStats(basePrices),
      compare: getStats(comparePrices)
    };
  }, [filteredData, baseCycle, compareCycle]);

  const totalBudgetQty = gapData.reduce((sum, item) => sum + item.budgetQty, 0);
  const totalForecastQty = gapData.reduce((sum, item) => sum + item.forecastQty, 0);
  
  const baseAvgPriceMt = totalBudgetQty > 0 ? totalBudgetSales / totalBudgetQty : 0;
  const compareAvgPriceMt = totalForecastQty > 0 ? totalForecastSales / totalForecastQty : 0;

  const baseCostMt = totalBudgetQty > 0 ? (totalBudgetSales - totalBudgetGP) / totalBudgetQty : 0;
  const compareCostMt = totalForecastQty > 0 ? (totalForecastSales - totalForecastGP) / totalForecastQty : 0;

  const baseGpMt = totalBudgetQty > 0 ? totalBudgetGP / totalBudgetQty : 0;
  const compareGpMt = totalForecastQty > 0 ? totalForecastGP / totalForecastQty : 0;

  const unitEconomicsData = [
    {
      metric: 'Avg Price / MT',
      [baseCycle]: baseAvgPriceMt,
      [compareCycle]: compareAvgPriceMt
    },
    {
      metric: 'Cost / MT',
      [baseCycle]: baseCostMt,
      [compareCycle]: compareCostMt
    },
    {
      metric: 'GP / MT',
      [baseCycle]: baseGpMt,
      [compareCycle]: compareGpMt
    }
  ];

  const priceStatsData = [
    { name: 'P10', [baseCycle]: priceStats.base.p10, [compareCycle]: priceStats.compare.p10 },
    { name: 'P50 (Median)', [baseCycle]: priceStats.base.p50, [compareCycle]: priceStats.compare.p50 },
    { name: 'P90', [baseCycle]: priceStats.base.p90, [compareCycle]: priceStats.compare.p90 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gap Analysis</h1>
          <p className="text-slate-500">Analyze variances between cycles, breaking down impacts of volume and price/margin changes.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Base:</span>
            <select 
              value={baseCycle}
              onChange={(e) => setBaseCycle(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="Budget">Budget</option>
              {availableCycles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <span className="text-slate-400 font-bold">VS</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Compare:</span>
            <select 
              value={compareCycle}
              onChange={(e) => setCompareCycle(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            >
              <option value="Budget">Budget</option>
              {availableCycles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
          <Filter size={18} />
          Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subsidiary</label>
            <select value={selectedSubsidiary} onChange={(e) => setSelectedSubsidiary(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {subsidiaries.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sales Rep</label>
            <select value={selectedSalesRep} onChange={(e) => setSelectedSalesRep(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {salesReps.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Client</label>
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
            <div 
              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer select-none"
              onClick={() => setIsMonthSelectOpen(!isMonthSelectOpen)}
            >
              {selectedMonths.length === 0 ? 'All' : `${selectedMonths.length} selected`}
            </div>
            {isMonthSelectOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {months.map(m => {
                  const labelStr = new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'short' });
                  return (
                    <label key={m} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={selectedMonths.includes(m)} 
                        onChange={() => {
                          if (selectedMonths.includes(m)) {
                            setSelectedMonths(selectedMonths.filter(sm => sm !== m));
                          } else {
                            setSelectedMonths([...selectedMonths, m]);
                          }
                        }} 
                        className="mr-2" 
                      />
                      {labelStr}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Target size={18} />
            <span className="font-medium">Total {baseCycle} (Sales)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalBudgetSales)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <span className="font-medium">Total {compareCycle} (Sales)</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalForecastSales)}</div>
        </div>
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 ${totalSalesGap < 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <AlertTriangle size={18} className={totalSalesGap < 0 ? 'text-red-500' : 'text-emerald-500'} />
            <span className="font-medium">Sales Variance</span>
          </div>
          <div className={`text-2xl font-bold ${totalSalesGap < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalSalesGap > 0 ? '+' : ''}{formatCurrency(totalSalesGap)}
            <span className="text-sm ml-2 font-normal">
              ({totalBudgetSales > 0 ? ((totalSalesGap / totalBudgetSales) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 ${totalGPGap < 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <AlertTriangle size={18} className={totalGPGap < 0 ? 'text-red-500' : 'text-emerald-500'} />
            <span className="font-medium">GP Variance</span>
          </div>
          <div className={`text-2xl font-bold ${totalGPGap < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalGPGap > 0 ? '+' : ''}{formatCurrency(totalGPGap)}
            <span className="text-sm ml-2 font-normal">
              ({totalBudgetGP > 0 ? ((totalGPGap / totalBudgetGP) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MaximizeWrapper title="Sales Variance Drivers">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-500">Volume Impact</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${totalSalesVolumeVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalSalesVolumeVar >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalSalesVolumeVar > 0 ? '+' : ''}{formatCurrency(totalSalesVolumeVar)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Price Impact</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${totalSalesPriceVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalSalesPriceVar >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalSalesPriceVar > 0 ? '+' : ''}{formatCurrency(totalSalesPriceVar)}
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="product" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="salesVolumeVariance" name="Volume Impact" stackId="a" fill="#3b82f6" />
                <Bar dataKey="salesPriceVariance" name="Price Impact" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Gross Profit Variance Drivers">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-500">Volume Impact</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${totalGPVolumeVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalGPVolumeVar >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalGPVolumeVar > 0 ? '+' : ''}{formatCurrency(totalGPVolumeVar)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Margin Impact</div>
              <div className={`text-xl font-bold flex items-center gap-1 ${totalGPMarginVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalGPMarginVar >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalGPMarginVar > 0 ? '+' : ''}{formatCurrency(totalGPMarginVar)}
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="product" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="gpVolumeVariance" name="Volume Impact" stackId="a" fill="#10b981" />
                <Bar dataKey="gpMarginVariance" name="Margin Impact" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-bold text-slate-800">Unit Economics & Price Stability</h2>
        <p className="text-slate-500 text-sm">Statistical breakdown of Per MT performance and outlier handling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MaximizeWrapper title="Unit Economics (Per MT)">
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitEconomicsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value as number)} cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey={baseCycle} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey={compareCycle} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Price Distribution (P10 / Median / P90)">
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceStatsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value as number)} cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey={baseCycle} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={compareCycle} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">{baseCycle} Price Stability</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Std Dev (σ)</div>
              <div className="text-lg font-bold">{formatCurrency(priceStats.base.stdDev)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Coef. of Var (CV)</div>
              <div className={`text-lg font-bold ${priceStats.base.cv > 0.35 ? 'text-red-600' : 'text-slate-800'}`}>
                {(priceStats.base.cv * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Trimmed Count</div>
              <div className="text-lg font-bold">{priceStats.base.trimmedCount} <span className="text-slate-400 text-sm">/ {priceStats.base.count}</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Outliers</div>
              <div className="text-lg font-bold">{priceStats.base.outlierPercent.toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            {priceStats.base.cv < 0.1 ? 'Very tight pricing.' : priceStats.base.cv < 0.2 ? 'Normal variation.' : priceStats.base.cv < 0.35 ? 'High variation.' : 'Very high volatility.'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-4">{compareCycle} Price Stability</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Std Dev (σ)</div>
              <div className="text-lg font-bold">{formatCurrency(priceStats.compare.stdDev)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Coef. of Var (CV)</div>
              <div className={`text-lg font-bold ${priceStats.compare.cv > 0.35 ? 'text-red-600' : 'text-slate-800'}`}>
                {(priceStats.compare.cv * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Trimmed Count</div>
              <div className="text-lg font-bold">{priceStats.compare.trimmedCount} <span className="text-slate-400 text-sm">/ {priceStats.compare.count}</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold">Outliers</div>
              <div className="text-lg font-bold">{priceStats.compare.outlierPercent.toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            {priceStats.compare.cv < 0.1 ? 'Very tight pricing.' : priceStats.compare.cv < 0.2 ? 'Normal variation.' : priceStats.compare.cv < 0.35 ? 'High variation.' : 'Very high volatility.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysisScreen;
