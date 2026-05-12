import React, { useState, useMemo, useRef } from 'react';
import { ForecastRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Line, ComposedChart, LabelList } from 'recharts';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface DetailedChartsScreenProps {
  data: ForecastRecord[];
  currentCycle: string;
}

const DetailedChartsScreen: React.FC<DetailedChartsScreenProps> = ({ data, currentCycle }) => {
  const [timeframe, setTimeframe] = useState<'FY' | 'YTD' | 'LATEST'>('FY');
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const latestCompletedMonth = Math.max(1, new Date().getMonth()); // If March (3), latest is Feb (2)

  // Determine versions
  const prevCycleMatch = currentCycle.match(/S&OP(\d+)/);
  const yearMatch = currentCycle.match(/\b(20\d{2})\b/);
  
  let prevCycle = 'S&OP0';
  if (prevCycleMatch) {
    prevCycle = `S&OP${parseInt(prevCycleMatch[1]) - 1}`;
  } else if (yearMatch) {
    prevCycle = `${parseInt(yearMatch[1]) - 1}`;
  }

  // Filter data based on timeframe
  const filteredData = useMemo(() => {
    if (timeframe === 'YTD') {
      return data.filter(d => d.month <= latestCompletedMonth);
    }
    if (timeframe === 'LATEST') {
      return data.filter(d => d.month === latestCompletedMonth);
    }
    return data;
  }, [data, timeframe, latestCompletedMonth]);

  const cycleYear = useMemo(() => {
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

  // Helper to get records for a specific version/status
  const getRecords = (records: ForecastRecord[], type: 'current' | 'budget' | 'prev' | 'py') => {
    switch (type) {
      case 'current':
        return records.filter(d => (d.version === currentCycle || d.status === 'Booked') && d.status !== 'Budget');
      case 'budget':
        return records.filter(d => 
          (d.status === 'Budget' || d.version === 'Budget' || d.version?.includes('Budget')) && 
          Number(d.year) === cycleYear &&
          d.status !== 'Booked' &&
          d.status !== 'Forecasted'
        );
      case 'prev':
        return records.filter(d => d.version === prevCycle && d.status !== 'Budget');
      case 'py':
        return records.filter(d => 
          (d.version === 'PY' || Number(d.year) === cycleYear - 1) && 
          d.status !== 'Budget'
        );
    }
  };

  const curRecords = getRecords(filteredData, 'current');
  const budRecords = getRecords(filteredData, 'budget');
  const prevRecords = getRecords(filteredData, 'prev');
  const pyRecords = getRecords(filteredData, 'py');

  // 1. P&L Calculation
  const calculatePnL = (records: ForecastRecord[]) => {
    const sales = records.reduce((sum, r) => sum + (r.sales || 0), 0);
    const gp = records.reduce((sum, r) => sum + (r.gp || 0), 0);
    const commissions = records.filter(r => r.section === 'Broker').reduce((sum, r) => sum + (r.gp || 0), 0);
    const gm = gp - commissions;
    const cogs = sales - gm;
    const gmPercent = sales ? gm / sales : 0;
    const gpPercent = sales ? gp / sales : 0;
    
    return { sales, cogs, gm, gmPercent, commissions, gp, gpPercent };
  };

  const pnlCurrent = calculatePnL(curRecords);
  const pnlBudget = calculatePnL(budRecords);
  const pnlPrev = calculatePnL(prevRecords);
  const pnlPY = calculatePnL(pyRecords);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(val);
  const formatChartPct = (val: number | undefined) => (val && val > 0.08) ? `${(val * 100).toFixed(0)}%` : '';
  const calcVar = (act: number, tgt: number) => tgt ? (act - tgt) / Math.abs(tgt) : 0;

  const pnlRows = [
    { label: 'Sales', cur: pnlCurrent.sales, bud: pnlBudget.sales, prev: pnlPrev.sales, py: pnlPY.sales },
    { label: 'COGS', cur: pnlCurrent.cogs, bud: pnlBudget.cogs, prev: pnlPrev.cogs, py: pnlPY.cogs },
    { label: 'GM', cur: pnlCurrent.gm, bud: pnlBudget.gm, prev: pnlPrev.gm, py: pnlPY.gm, isSubtotal: true },
    { label: 'GM %', cur: pnlCurrent.gmPercent, bud: pnlBudget.gmPercent, prev: pnlPrev.gmPercent, py: pnlPY.gmPercent, isPercent: true },
    { label: 'Commissions (Broker)', cur: pnlCurrent.commissions, bud: pnlBudget.commissions, prev: pnlPrev.commissions, py: pnlPY.commissions },
    { label: 'GP', cur: pnlCurrent.gp, bud: pnlBudget.gp, prev: pnlPrev.gp, py: pnlPY.gp, isSubtotal: true },
    { label: 'GP %', cur: pnlCurrent.gpPercent, bud: pnlBudget.gpPercent, prev: pnlPrev.gpPercent, py: pnlPY.gpPercent, isPercent: true },
  ];

  // 2. Per Month Sales and GP
  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => {
      const monthRecords = data.filter(d => Number(d.month) === m);
      
      const mCur = getRecords(monthRecords, 'current');
      const mBud = getRecords(monthRecords, 'budget');
      const mPrev = getRecords(monthRecords, 'prev');
      const mPY = getRecords(monthRecords, 'py');

      const salesCur = mCur.reduce((sum, r) => sum + (r.sales || 0), 0);
      const salesBooked = mCur.filter(r => r.status === 'Booked').reduce((sum, r) => sum + (r.sales || 0), 0);
      const salesForecasted = salesCur - salesBooked;
      
      const gpCur = mCur.reduce((sum, r) => sum + (r.gp || 0), 0);
      const gpBooked = mCur.filter(r => r.status === 'Booked').reduce((sum, r) => sum + (r.gp || 0), 0);
      const gpForecasted = gpCur - gpBooked;

      return {
        month: monthNames[m - 1],
        salesCur,
        salesBooked,
        salesForecasted,
        salesBookedPct: salesCur > 0 ? salesBooked / salesCur : 0,
        salesForecastedPct: salesCur > 0 ? salesForecasted / salesCur : 0,
        salesBud: mBud.reduce((sum, r) => sum + (r.sales || 0), 0),
        salesPrev: mPrev.reduce((sum, r) => sum + (r.sales || 0), 0),
        salesPY: mPY.reduce((sum, r) => sum + (r.sales || 0), 0),
        
        gpCur,
        gpBooked,
        gpForecasted,
        gpBookedPct: gpCur > 0 ? gpBooked / gpCur : 0,
        gpForecastedPct: gpCur > 0 ? gpForecasted / gpCur : 0,
        gpBud: mBud.reduce((sum, r) => sum + (r.gp || 0), 0),
        gpPrev: mPrev.reduce((sum, r) => sum + (r.gp || 0), 0),
        gpPY: mPY.reduce((sum, r) => sum + (r.gp || 0), 0),
      };
    }).filter(m => m.salesCur > 0 || m.salesBud > 0 || m.salesPY > 0);
  }, [data, currentCycle, prevCycle]);

  // 3-6. Pareto Analysis (Clients, Categories, Countries)
  const generatePareto = (groupBy: 'client' | 'category' | 'country', sortBy: 'sales' | 'gp') => {
    const totalCurSales = curRecords.reduce((sum, r) => sum + (r.sales || 0), 0);
    const totalCurGp = curRecords.reduce((sum, r) => sum + (r.gp || 0), 0);
    const totalSortMetric = sortBy === 'sales' ? totalCurSales : totalCurGp;

    const grouped = curRecords.reduce((acc, r) => {
      const key = r[groupBy as keyof ForecastRecord] as string || 'Unknown';
      if (!acc[key]) acc[key] = { key, sales: 0, gp: 0, vol: 0, bookedSales: 0, bookedGp: 0, budSales: 0, budGp: 0, pySales: 0, pyGp: 0 };
      acc[key].sales += r.sales || 0;
      acc[key].gp += r.gp || 0;
      acc[key].vol += r.qty || 0;
      if (r.status === 'Booked') {
        acc[key].bookedSales += r.sales || 0;
        acc[key].bookedGp += r.gp || 0;
      }
      return acc;
    }, {} as Record<string, { key: string, sales: number, gp: number, vol: number, bookedSales: number, bookedGp: number, budSales: number, budGp: number, pySales: number, pyGp: number }>);

    let sorted = (Object.values(grouped) as any[]).sort((a, b) => b[sortBy] - a[sortBy]);
    
    // Pareto: Top 80% or top N. Let's do top 80% of metric
    let cumulative = 0;
    const top: any[] = [];
    const others = { key: 'Others', sales: 0, gp: 0, vol: 0, bookedSales: 0, bookedGp: 0, budSales: 0, budGp: 0, pySales: 0, pyGp: 0 };

    sorted.forEach(item => {
      // Get budget and PY for this item
      const itemBud = budRecords.filter(r => r[groupBy as keyof ForecastRecord] === item.key);
      const itemPY = pyRecords.filter(r => r[groupBy as keyof ForecastRecord] === item.key);
      item.budSales = itemBud.reduce((sum, r) => sum + (r.sales || 0), 0);
      item.budGp = itemBud.reduce((sum, r) => sum + (r.gp || 0), 0);
      item.pySales = itemPY.reduce((sum, r) => sum + (r.sales || 0), 0);
      item.pyGp = itemPY.reduce((sum, r) => sum + (r.gp || 0), 0);

      // Don't group into "Others" for categories or countries, only for clients
      if (groupBy !== 'client' || (cumulative < totalSortMetric * 0.8 && top.length < 10)) {
        top.push(item);
        cumulative += item[sortBy];
      } else {
        others.sales += item.sales;
        others.gp += item.gp;
        others.vol += item.vol;
        others.bookedSales += item.bookedSales;
        others.bookedGp += item.bookedGp;
        others.budSales += item.budSales;
        others.budGp += item.budGp;
        others.pySales += item.pySales;
        others.pyGp += item.pyGp;
      }
    });

    if (groupBy === 'client' && (others.sales > 0 || others.gp > 0)) top.push(others);

    return top.map(item => ({
      ...item,
      gpPercent: item.sales ? item.gp / item.sales : 0,
      contribPercent: totalSortMetric ? item[sortBy] / totalSortMetric : 0,
      bookedPercent: item[sortBy] ? (sortBy === 'sales' ? item.bookedSales / item.sales : item.bookedGp / item.gp) : 0,
      varBud: calcVar(item[sortBy], sortBy === 'sales' ? item.budSales : item.budGp),
      varPY: calcVar(item[sortBy], sortBy === 'sales' ? item.pySales : item.pyGp),
    }));
  };

  const clientSalesPareto = generatePareto('client', 'sales');
  const clientGpPareto = generatePareto('client', 'gp');
  const catSalesPareto = generatePareto('category', 'sales');
  const catGpPareto = generatePareto('category', 'gp');
  const countrySalesPareto = generatePareto('country', 'sales');
  const countryGpPareto = generatePareto('country', 'gp');

  const renderParetoTable = (data: any[], title: string, sortBy: 'sales' | 'gp', id: string) => (
    <MaximizeWrapper title={title} className="pptx-export-target overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th className="py-2 px-3">Name</th>
            <th className="py-2 px-3 text-right">S&OP {sortBy === 'sales' ? 'Sales' : 'GP'}</th>
            <th className="py-2 px-3 text-right">GP %</th>
            <th className="py-2 px-3 text-right">Volume</th>
            <th className="py-2 px-3 text-right">Contrib %</th>
            <th className="py-2 px-3 text-right">% Booked</th>
            <th className="py-2 px-3 text-right">vs Budget</th>
            <th className="py-2 px-3 text-right">vs PY</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => (
            <tr key={i} className={row.key === 'Others' ? 'bg-slate-50 font-medium' : ''}>
              <td className="py-2 px-3">{row.key}</td>
              <td className="py-2 px-3 text-right">{formatCurrency(sortBy === 'sales' ? row.sales : row.gp)}</td>
              <td className="py-2 px-3 text-right">{formatPercent(row.gpPercent)}</td>
              <td className="py-2 px-3 text-right">{row.vol.toLocaleString()}</td>
              <td className="py-2 px-3 text-right">{formatPercent(row.contribPercent)}</td>
              <td className="py-2 px-3 text-right">{formatPercent(row.bookedPercent)}</td>
              <td className={`py-2 px-3 text-right ${row.varBud >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {row.varBud > 0 ? '+' : ''}{formatPercent(row.varBud)}
              </td>
              <td className={`py-2 px-3 text-right ${row.varPY >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {row.varPY > 0 ? '+' : ''}{formatPercent(row.varPY)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </MaximizeWrapper>
  );

  const exportToCSV = () => {
    const headers = [
      'subsidiary', 'id', 'section', 'client', 'country', 'product', 'category', 
      'month', 'year', 'version', 'qty', 'sales', 'gp', 'salesPerson', 'salesPersonEmail', 'status', 'supplier'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header as keyof ForecastRecord];
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== undefined && val !== null ? val : '';
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Full_Data_${currentCycle}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPPTX = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    
    try {
      const pres = new pptxgen();
      pres.author = 'Demand & Supply Forecaster';
      pres.company = 'Company';
      pres.title = `Detailed Charts - ${currentCycle} - ${timeframe}`;

      // Find all elements we want to export
      const targets = containerRef.current.querySelectorAll('.pptx-export-target');
      
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i] as HTMLElement;
        
        const originalWidth = target.style.width;
        const originalPosition = target.style.position;
        
        // Temporarily remove overflow and set width to ensure full capture
        const hadOverflow = target.classList.contains('overflow-x-auto');
        if (hadOverflow) {
          target.classList.remove('overflow-x-auto');
        }
        target.style.width = 'max-content';
        target.style.position = 'relative';

        // Add a slide for each target
        const slide = pres.addSlide();
        
        // Add title based on the h3 inside the target
        const titleEl = target.querySelector('h3');
        if (titleEl) {
          slide.addText(titleEl.innerText, { x: 0.5, y: 0.5, w: '90%', h: 0.5, fontSize: 18, bold: true, color: '333333' });
        }

        // Capture the element as an image
        const canvas = await html2canvas(target, { 
          scale: 2, 
          logging: false, 
          backgroundColor: '#ffffff',
          windowWidth: target.scrollWidth,
          width: target.scrollWidth
        });
        const imgData = canvas.toDataURL('image/png');

        // Restore styles
        if (hadOverflow) {
          target.classList.add('overflow-x-auto');
        }
        target.style.width = originalWidth;
        target.style.position = originalPosition;
        
        // Add image to slide
        // Calculate aspect ratio to fit on slide
        const imgRatio = canvas.width / canvas.height;
        const slideW = 9; // inches
        const slideH = 4.5; // inches
        
        let finalW = slideW;
        let finalH = slideW / imgRatio;
        
        if (finalH > slideH) {
          finalH = slideH;
          finalW = slideH * imgRatio;
        }

        slide.addImage({
          data: imgData,
          x: (10 - finalW) / 2, // Center horizontally (10 is default slide width)
          y: 1.2,
          w: finalW,
          h: finalH
        });
      }

      await pres.writeFile({ fileName: `Detailed_Charts_${currentCycle}_${timeframe}.pptx` });
    } catch (error) {
      console.error('Error exporting to PPTX:', error);
      alert('Failed to export to PPTX. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" ref={containerRef}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Detailed Charts & Analysis</h1>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeframe('LATEST')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeframe === 'LATEST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Latest Month (M{latestCompletedMonth})
            </button>
            <button
              onClick={() => setTimeframe('YTD')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeframe === 'YTD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              YTD (M1-M{latestCompletedMonth})
            </button>
            <button
              onClick={() => setTimeframe('FY')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${timeframe === 'FY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Full Year
            </button>
          </div>
          
          <button
            onClick={exportToPPTX}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            <span>{isExporting ? 'Exporting...' : 'Export PPTX'}</span>
          </button>
        </div>
      </div>

      {/* 1. P&L Table */}
      <MaximizeWrapper title={`Income Statement (P&L) - ${timeframe}`} className="pptx-export-target overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Metric</th>
              <th className="py-3 px-4 text-right">This S&OP ({currentCycle})</th>
              <th className="py-3 px-4 text-right">Budget</th>
              <th className="py-3 px-4 text-right">Prev S&OP ({prevCycle})</th>
              <th className="py-3 px-4 text-right">PY</th>
              <th className="py-3 px-4 text-right">Var vs Bud</th>
              <th className="py-3 px-4 text-right">Var vs PY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pnlRows.map((row, i) => {
              const varBud = calcVar(row.cur, row.bud);
              const varPY = calcVar(row.cur, row.py);
              return (
                <tr key={i} className={row.isSubtotal ? 'bg-slate-50 font-semibold' : ''}>
                  <td className="py-3 px-4">{row.label}</td>
                  <td className="py-3 px-4 text-right">{row.isPercent ? formatPercent(row.cur) : formatCurrency(row.cur)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{row.isPercent ? formatPercent(row.bud) : formatCurrency(row.bud)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{row.isPercent ? formatPercent(row.prev) : formatCurrency(row.prev)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{row.isPercent ? formatPercent(row.py) : formatCurrency(row.py)}</td>
                  <td className={`py-3 px-4 text-right ${varBud >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {varBud > 0 ? '+' : ''}{formatPercent(varBud)}
                  </td>
                  <td className={`py-3 px-4 text-right ${varPY >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {varPY > 0 ? '+' : ''}{formatPercent(varPY)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </MaximizeWrapper>

      {/* 2. Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaximizeWrapper title="Monthly Sales" className="pptx-export-target h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="salesBooked" stackId="sop" name="Booked Sales" fill="#10b981">
                <LabelList dataKey="salesBookedPct" position="center" formatter={formatChartPct} fill="#ffffff" fontSize={9} />
              </Bar>
              <Bar dataKey="salesForecasted" stackId="sop" name="Forecasted Sales" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="salesForecastedPct" position="center" formatter={formatChartPct} fill="#ffffff" fontSize={9} />
              </Bar>
              <Bar dataKey="salesBud" name="Budget" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="salesPrev" name="Prev S&OP" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="salesPY" name="PY" stroke="#ef4444" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </MaximizeWrapper>

        <MaximizeWrapper title="Monthly GP" className="pptx-export-target h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="gpBooked" stackId="sop" name="Booked GP" fill="#10b981">
                <LabelList dataKey="gpBookedPct" position="center" formatter={formatChartPct} fill="#ffffff" fontSize={9} />
              </Bar>
              <Bar dataKey="gpForecasted" stackId="sop" name="Forecasted GP" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="gpForecastedPct" position="center" formatter={formatChartPct} fill="#ffffff" fontSize={9} />
              </Bar>
              <Bar dataKey="gpBud" name="Budget" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="gpPrev" name="Prev S&OP" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="gpPY" name="PY" stroke="#ef4444" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </MaximizeWrapper>
      </div>

      {/* 3-6. Pareto Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderParetoTable(clientSalesPareto, 'Top Clients by Sales', 'sales', 'pareto-client-sales')}
        {renderParetoTable(clientGpPareto, 'Top Clients by GP', 'gp', 'pareto-client-gp')}
        {renderParetoTable(catSalesPareto, 'Categories by Sales', 'sales', 'pareto-cat-sales')}
        {renderParetoTable(catGpPareto, 'Categories by GP', 'gp', 'pareto-cat-gp')}
        {renderParetoTable(countrySalesPareto, 'Countries by Sales', 'sales', 'pareto-country-sales')}
        {renderParetoTable(countryGpPareto, 'Countries by GP', 'gp', 'pareto-country-gp')}
      </div>

      {/* 7. Full Data Table */}
      <MaximizeWrapper title="Full Data (After Modifications)" className="pptx-export-target overflow-x-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-2 px-3">Subsidiary</th>
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Section</th>
                <th className="py-2 px-3">Client</th>
                <th className="py-2 px-3">Country</th>
                <th className="py-2 px-3">Product</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Month</th>
                <th className="py-2 px-3">Year</th>
                <th className="py-2 px-3">Version</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Sales</th>
                <th className="py-2 px-3 text-right">GP</th>
                <th className="py-2 px-3">Sales Person</th>
                <th className="py-2 px-3">Sales Person Email</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slice(0, 100).map((row, i) => (
                <tr key={i}>
                  <td className="py-2 px-3">{row.subsidiary}</td>
                  <td className="py-2 px-3">{row.id}</td>
                  <td className="py-2 px-3">{row.section}</td>
                  <td className="py-2 px-3">{row.client}</td>
                  <td className="py-2 px-3">{row.country}</td>
                  <td className="py-2 px-3">{row.product}</td>
                  <td className="py-2 px-3">{row.category}</td>
                  <td className="py-2 px-3">{row.month}</td>
                  <td className="py-2 px-3">{row.year}</td>
                  <td className="py-2 px-3">{row.version}</td>
                  <td className="py-2 px-3 text-right">{row.qty}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(row.sales)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(row.gp)}</td>
                  <td className="py-2 px-3">{row.salesPerson}</td>
                  <td className="py-2 px-3">{row.salesPersonEmail}</td>
                  <td className="py-2 px-3">{row.status}</td>
                  <td className="py-2 px-3">{row.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 100 && (
            <div className="py-3 text-center text-slate-500 text-sm">
              Showing first 100 rows. Export to CSV to see all {data.length} rows.
            </div>
          )}
        </div>
      </MaximizeWrapper>
    </div>
  );
};

export default DetailedChartsScreen;
