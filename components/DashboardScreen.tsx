import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ForecastRecord, Client, Product } from '../types';
import { DollarSign, Package, TrendingUp, Users, CheckCircle, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Legend, PieChart, Pie } from 'recharts';
import { MultiSelect } from './MultiSelect';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
  clients: Client[];
  products: Product[];
  currentCycle: string;
}

const DashboardScreen: React.FC<Props> = ({ data, clients, products, currentCycle }) => {
  const [selectedSalesRep, setSelectedSalesRep] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string[]>([]);
  
  const [initialized, setInitialized] = useState(false);

  const cycleYear = useMemo(() => {
    const yearMatch = currentCycle.match(/\b(20\d{2})\b/);
    if (yearMatch) return parseInt(yearMatch[1]);
    
    // Fallback: find the most common year in this cycle's data, favoring the latest year if tied
    const cycleRecords = data.filter(d => d.version === currentCycle);
    if (cycleRecords.length > 0) {
      let maxYear = new Date().getFullYear();
      let maxCount = 0;
      
      const yearCounts = cycleRecords.reduce((acc, rec) => {
        acc[rec.year] = (acc[rec.year] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      // Sort years descending so that we prefer latest year
      const sortedYears = Object.keys(yearCounts).map(Number).sort((a, b) => b - a);
      for (const year of sortedYears) {
        // If we want the *target* year of a forecast, usually the forecast is for the *highest* year it contains significant data for.
        if (yearCounts[year] > maxCount * 0.8) { // If it has at least 80% of the max count, prefer the higher year
          maxCount = yearCounts[year];
          maxYear = year;
        }
      }
      return maxYear;
    }
    return new Date().getFullYear();
  }, [currentCycle, data]);

  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => d.year.toString()));
    return (Array.from(years) as string[]).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const subsidiaries = useMemo(() => {
    const validData = data.filter(d => {
      const rep = d.salesPerson || 'Unassigned';
      let repMatch = selectedSalesRep.length === 0 || selectedSalesRep.includes(rep);
      if (!repMatch) {
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(d.category || 'Uncategorized')) return false;
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(d.supplier || 'Unknown')) return false;
      if (selectedClient.length > 0 && !selectedClient.includes(d.client || 'Unknown')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      return true;
    });
    const subs = new Set(validData.map(d => d.subsidiary || 'Unassigned'));
    return Array.from(subs).sort();
  }, [data, clients, selectedSalesRep, selectedCategory, selectedSupplier, selectedClient, selectedSection]);

  const sections = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      const rep = d.salesPerson || 'Unassigned';
      let repMatch = selectedSalesRep.length === 0 || selectedSalesRep.includes(rep);
      if (!repMatch) {
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(d.category || 'Uncategorized')) return false;
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(d.supplier || 'Unknown')) return false;
      if (selectedClient.length > 0 && !selectedClient.includes(d.client || 'Unknown')) return false;
      return true;
    });
    const sects = new Set(validData.map(d => d.section || 'Unknown'));
    return Array.from(sects).sort();
  }, [data, clients, selectedSubsidiary, selectedSalesRep, selectedCategory, selectedSupplier, selectedClient]);

  const salesReps = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(d.category || 'Uncategorized')) return false;
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(d.supplier || 'Unknown')) return false;
      if (selectedClient.length > 0 && !selectedClient.includes(d.client || 'Unknown')) return false;
      return true;
    });
    const reps = new Set(validData.map(d => {
      const clientInfo = clients.find(c => c.name === d.client);
      return d.salesPerson || (clientInfo?.salesRepName) || 'Unassigned';
    }));
    return Array.from(reps).sort();
  }, [data, clients, selectedSubsidiary, selectedSection, selectedCategory, selectedSupplier, selectedClient]);

  const categories = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      const rep = d.salesPerson || 'Unassigned';
      let repMatch = selectedSalesRep.length === 0 || selectedSalesRep.includes(rep);
      if (!repMatch) {
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(d.supplier || 'Unknown')) return false;
      if (selectedClient.length > 0 && !selectedClient.includes(d.client || 'Unknown')) return false;
      return true;
    });
    const cats = new Set(validData.map(p => p.category || 'Uncategorized'));
    return Array.from(cats).sort();
  }, [data, clients, selectedSubsidiary, selectedSalesRep, selectedSupplier, selectedClient]);

  const suppliers = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      const rep = d.salesPerson || 'Unassigned';
      let repMatch = selectedSalesRep.length === 0 || selectedSalesRep.includes(rep);
      if (!repMatch) {
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(d.category || 'Uncategorized')) return false;
      if (selectedClient.length > 0 && !selectedClient.includes(d.client || 'Unknown')) return false;
      return true;
    });
    const sups = new Set(validData.map(d => d.supplier || 'Unknown'));
    return Array.from(sups).sort();
  }, [data, clients, selectedSubsidiary, selectedSalesRep, selectedCategory, selectedClient]);

  const clientNames = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      const rep = d.salesPerson || 'Unassigned';
      let repMatch = selectedSalesRep.length === 0 || selectedSalesRep.includes(rep);
      if (!repMatch) {
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;
      if (selectedCategory.length > 0 && !selectedCategory.includes(d.category || 'Uncategorized')) return false;
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(d.supplier || 'Unknown')) return false;
      return true;
    });
    const cls = new Set(validData.map(d => d.client || 'Unknown'));
    return Array.from(cls).sort();
  }, [data, clients, selectedSubsidiary, selectedSalesRep, selectedCategory, selectedSupplier]);

  // Initialize selected values with all options only once
  useEffect(() => {
    if (!initialized && data.length > 0) {
      const allSubs = Array.from(new Set(data.map(d => d.subsidiary || 'Unassigned'))).sort();
      const allReps = Array.from(new Set(data.map(d => {
        const clientInfo = clients.find(c => c.name === d.client);
        return d.salesPerson || (clientInfo?.salesRepName) || 'Unassigned';
      }))).sort();
      const allCats = Array.from(new Set(data.map(d => d.category || 'Uncategorized'))).sort();
      const allSups = Array.from(new Set(data.map(d => d.supplier || 'Unknown'))).sort();
      const allCls = Array.from(new Set(data.map(d => d.client || 'Unknown'))).sort();
      const allSects = Array.from(new Set(data.map(d => d.section || 'Unknown'))).sort();
      
      setSelectedSubsidiary(allSubs);
      setSelectedSalesRep(allReps);
      setSelectedCategory(allCats);
      setSelectedSupplier(allSups);
      setSelectedClient(allCls);
      setSelectedSection(allSects);
      
      setInitialized(true);
    }
  }, [data, clients, initialized]);

  const baseFilteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      
      let repMatch = false;
      if (selectedSalesRep.length === 0) {
        repMatch = true; // No filter applied
      } else {
        const rep = d.salesPerson || 'Unassigned';
        if (selectedSalesRep.includes(rep)) repMatch = true;
        const clientInfo = clients.find(c => c.name === d.client);
        if (clientInfo && selectedSalesRep.includes(clientInfo.salesRepName || 'Unassigned')) repMatch = true;
      }
      if (!repMatch) return false;

      const sup = d.supplier || 'Unknown';
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(sup)) return false;

      const clientName = d.client || 'Unknown';
      if (selectedClient.length > 0 && !selectedClient.includes(clientName)) return false;
      
      const cat = d.category || 'Uncategorized';
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat)) return false;

      return true;
    });
  }, [data, clients, selectedSubsidiary, selectedSalesRep, selectedSupplier, selectedClient, selectedCategory]);

  const filteredData = useMemo(() => {
    return baseFilteredData.filter(d => {
      if (Number(d.year) !== cycleYear) return false;
      return true;
    });
  }, [baseFilteredData, cycleYear]);

  const handleClearFilters = () => {
    const allSubs = Array.from(new Set(data.map(d => d.subsidiary || 'Unassigned'))).sort();
    const allReps = Array.from(new Set(data.map(d => {
      const clientInfo = clients.find(c => c.name === d.client);
      return d.salesPerson || (clientInfo?.salesRepName) || 'Unassigned';
    }))).sort();
    const allCats = Array.from(new Set(data.map(d => d.category || 'Uncategorized'))).sort();
    const allSups = Array.from(new Set(data.map(d => d.supplier || 'Unknown'))).sort();
    const allCls = Array.from(new Set(data.map(d => d.client || 'Unknown'))).sort();
    const allSects = Array.from(new Set(data.map(d => d.section || 'Unknown'))).sort();
    const allYears = (Array.from(new Set(data.map(d => d.year.toString()))) as string[]).sort((a, b) => b.localeCompare(a));
    
    setSelectedSubsidiary(allSubs);
    setSelectedSalesRep(allReps);
    setSelectedCategory(allCats);
    setSelectedSupplier(allSups);
    setSelectedClient(allCls);
    setSelectedSection(allSects);
  };

  const stats = useMemo(() => {
    // We already filtered by year in filteredData
    const currentYearData = filteredData;
    const prevYearStr = (cycleYear - 1).toString();
    const prevYearData = baseFilteredData.filter(d => (d.year.toString() === prevYearStr && (d.version === currentCycle || d.version === 'PY')) || d.version === 'PY');

    // Filter for Forecasted, Draft, and Booked status to show current forecast state
    const currentData = currentYearData.filter(d => 
      ((d.version === currentCycle && (d.status === 'Forecasted' || d.status === 'Draft' || d.version === 'PY')) || d.status === 'Booked') 
      && d.status !== 'Budget'
    );
    const budgetData = currentYearData.filter(d => d.status === 'Budget' || d.version === 'Budget');
    const bookedData = currentYearData.filter(d => d.status === 'Booked' || (d.version === currentCycle && d.version === 'PY'));
    
    // For previous year, we want actuals or the final forecast, excluding budget
    // Make sure we only grab PY data for the previous year OR Booked data for the previous year
    const prevYearCurrentData = prevYearData.filter(d => d.status !== 'Budget' && (d.version === 'PY' || d.status === 'Booked'));
    
    const totalSales = currentData.reduce((sum, rec) => sum + rec.sales, 0);
    const totalGP = currentData.reduce((sum, rec) => sum + rec.gp, 0);
    
    // Filter data by selected category for volume calculation to match product mix
    const categoryFilteredData = currentData.filter(rec => {
      const productInfo = products.find(p => p.name === rec.product);
      const category = productInfo?.category || rec.category || 'Uncategorized';
      return selectedCategory.length === categories.length || selectedCategory.includes(category);
    });
    const totalQty = categoryFilteredData.reduce((sum, rec) => sum + rec.qty, 0);

    const bookedSales = bookedData.reduce((sum, rec) => sum + rec.sales, 0);
    const bookedGP = bookedData.reduce((sum, rec) => sum + rec.gp, 0);
    const bookedQty = bookedData.reduce((sum, rec) => sum + rec.qty, 0);

    const bookedSalesPercent = totalSales > 0 ? (bookedSales / totalSales) * 100 : 0;
    const bookedGPPercent = totalGP > 0 ? (bookedGP / totalGP) * 100 : 0;
    const bookedQtyPercent = totalQty > 0 ? (bookedQty / totalQty) * 100 : 0;

    const budgetSales = budgetData.reduce((sum, rec) => sum + rec.sales, 0);
    const budgetGP = budgetData.reduce((sum, rec) => sum + rec.gp, 0);
    const budgetQty = budgetData.reduce((sum, rec) => sum + rec.qty, 0);

    const salesVsBudget = budgetSales !== 0 ? ((totalSales - budgetSales) / Math.abs(budgetSales)) * 100 : 0;
    const gpVsBudget = budgetGP !== 0 ? ((totalGP - budgetGP) / Math.abs(budgetGP)) * 100 : 0;
    const qtyVsBudget = budgetQty !== 0 ? ((totalQty - budgetQty) / Math.abs(budgetQty)) * 100 : 0;
    
    // Active Clients Count
    const activeClientsCount = new Set(currentData.map(d => d.client)).size;
    
    // Active Products Count
    const activeProductsCount = new Set(categoryFilteredData.map(d => d.product)).size;

    // Monthly Trend (Combo Chart & Budget Comparison) - Filtered to Current Year
    const monthlyDataMap: Record<string, { sortKey: string, month: string, sales: number, gp: number, budgetSales: number, budgetGP: number, gpPercent: number, prevYearSales: number, prevYearGP: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    currentData.forEach(rec => {
      const sortKey = `${rec.year}-${String(rec.month).padStart(2, '0')}`;
      if (!monthlyDataMap[sortKey]) {
        monthlyDataMap[sortKey] = { 
          sortKey,
          month: `${monthNames[rec.month - 1]} ${rec.year}`, 
          sales: 0, 
          gp: 0,
          budgetSales: 0,
          budgetGP: 0,
          gpPercent: 0,
          prevYearSales: 0,
          prevYearGP: 0
        };
      }
      monthlyDataMap[sortKey].sales += rec.sales;
      monthlyDataMap[sortKey].gp += rec.gp;
    });

    budgetData.forEach(rec => {
      const sortKey = `${rec.year}-${String(rec.month).padStart(2, '0')}`;
      if (!monthlyDataMap[sortKey]) {
        monthlyDataMap[sortKey] = { 
          sortKey,
          month: `${monthNames[rec.month - 1]} ${rec.year}`, 
          sales: 0, 
          gp: 0,
          budgetSales: 0,
          budgetGP: 0,
          gpPercent: 0,
          prevYearSales: 0,
          prevYearGP: 0
        };
      }
      monthlyDataMap[sortKey].budgetSales += rec.sales;
      monthlyDataMap[sortKey].budgetGP += rec.gp;
    });

    prevYearCurrentData.forEach(rec => {
      // Map it to the current year's month for comparison
      const currentYear = cycleYear.toString();
      const sortKey = `${currentYear}-${String(rec.month).padStart(2, '0')}`;
      if (!monthlyDataMap[sortKey]) {
        monthlyDataMap[sortKey] = { 
          sortKey,
          month: `${monthNames[rec.month - 1]} ${currentYear}`, 
          sales: 0, 
          gp: 0,
          budgetSales: 0,
          budgetGP: 0,
          gpPercent: 0,
          prevYearSales: 0,
          prevYearGP: 0
        };
      }
      monthlyDataMap[sortKey].prevYearSales += rec.sales;
      monthlyDataMap[sortKey].prevYearGP += rec.gp;
    });

    Object.values(monthlyDataMap).forEach(m => {
      m.gpPercent = m.sales > 0 ? (m.gp / m.sales) * 100 : 0;
    });

    const monthlyTrend = Object.values(monthlyDataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Product Mix - Volume & Value by Product (Filtered by Category)
    const productMap: Record<string, { product: string, volume: number, sales: number, gp: number }> = {};
    currentData.forEach(rec => {
      // Find the product to check its category
      const productInfo = products.find(p => p.name === rec.product);
      const category = productInfo?.category || rec.category || 'Uncategorized';
      
      if (selectedCategory.length !== categories.length && !selectedCategory.includes(category)) return;
      if (!productMap[rec.product]) productMap[rec.product] = { product: rec.product || 'Unknown', volume: 0, sales: 0, gp: 0 };
      productMap[rec.product].volume += (rec.qty || 0);
      productMap[rec.product].sales += (rec.sales || 0);
      productMap[rec.product].gp += (rec.gp || 0);
    });
    
    const productMixVolume = Object.values(productMap).map(p => ({...p, gpPercent: p.sales > 0 ? (p.gp / p.sales) * 100 : 0})).sort((a, b) => b.volume - a.volume);
    const productMixSales = Object.values(productMap).map(p => ({...p, gpPercent: p.sales > 0 ? (p.gp / p.sales) * 100 : 0})).sort((a, b) => b.sales - a.sales);

    // Top Clients Pareto
    const clientSalesMap: Record<string, { sales: number, gp: number }> = {};
    currentData.forEach(rec => {
      if (!clientSalesMap[rec.client]) clientSalesMap[rec.client] = { sales: 0, gp: 0 };
      clientSalesMap[rec.client].sales += rec.sales;
      clientSalesMap[rec.client].gp += rec.gp;
    });
    const allSortedClients = Object.entries(clientSalesMap)
      .map(([name, vals]) => ({ name, sales: vals.sales, gp: vals.gp }))
      .sort((a, b) => b.sales - a.sales);
    
    const topClients = allSortedClients.slice(0, 7);
    const otherClients = allSortedClients.slice(7);
    if (otherClients.length > 0) {
      const othersSales = otherClients.reduce((sum, c) => sum + c.sales, 0);
      const othersGP = otherClients.reduce((sum, c) => sum + c.gp, 0);
      topClients.push({ name: 'Others', sales: othersSales, gp: othersGP });
    }
    
    let cumulativeSales = 0;
    const totalClientSales = allSortedClients.reduce((sum, c) => sum + c.sales, 0);
    const paretoData = topClients.map(c => {
      cumulativeSales += c.sales;
      return {
        name: c.name,
        sales: c.sales,
        gpPercent: c.sales > 0 ? (c.gp / c.sales) * 100 : 0,
        cumulativePercent: totalClientSales > 0 ? (cumulativeSales / totalClientSales) * 100 : 0
      };
    });

    // Country Sales
    const countrySalesMap: Record<string, { sales: number, gp: number }> = {};
    currentData.forEach(rec => {
      const country = rec.country || 'Unknown';
      if (!countrySalesMap[country]) countrySalesMap[country] = { sales: 0, gp: 0 };
      countrySalesMap[country].sales += rec.sales;
      countrySalesMap[country].gp += rec.gp;
    });
    const countrySalesData = Object.entries(countrySalesMap)
      .map(([name, vals]) => ({ name, value: vals.sales, gpPercent: vals.sales > 0 ? (vals.gp / vals.sales) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // Waterfall Chart: GP Variance vs Budget
    const productGPMap: Record<string, { current: number, budget: number }> = {};
    currentData.forEach(rec => {
      if (!productGPMap[rec.product]) productGPMap[rec.product] = { current: 0, budget: 0 };
      productGPMap[rec.product].current += rec.gp;
    });
    budgetData.forEach(rec => {
      if (!productGPMap[rec.product]) productGPMap[rec.product] = { current: 0, budget: 0 };
      productGPMap[rec.product].budget += rec.gp;
    });

    const variances = Object.entries(productGPMap).map(([product, vals]) => ({
      product,
      variance: vals.current - vals.budget
    }));

    const positiveVariances = variances.filter(v => v.variance > 0).sort((a, b) => b.variance - a.variance);
    const negativeVariances = variances.filter(v => v.variance < 0).sort((a, b) => a.variance - b.variance);

    const top5Positive = positiveVariances.slice(0, 5);
    const top5Negative = negativeVariances.slice(0, 5);
    
    const otherPositive = positiveVariances.slice(5).reduce((sum, v) => sum + v.variance, 0);
    const otherNegative = negativeVariances.slice(5).reduce((sum, v) => sum + v.variance, 0);
    const othersVariance = otherPositive + otherNegative;

    let currentVal = budgetGP;
    const waterfallData = [];
    waterfallData.push({ name: 'Budget GP', range: [0, currentVal], color: '#94a3b8', value: currentVal, isTotal: true });

    top5Positive.forEach(d => {
      waterfallData.push({ name: `+ ${d.product}`, range: [currentVal, currentVal + d.variance], color: '#10b981', value: d.variance });
      currentVal += d.variance;
    });

    top5Negative.forEach(d => {
      waterfallData.push({ name: `- ${d.product}`, range: [currentVal + d.variance, currentVal], color: '#ef4444', value: d.variance });
      currentVal += d.variance;
    });
    
    if (othersVariance !== 0) {
      waterfallData.push({ 
        name: othersVariance > 0 ? '+ Others' : '- Others', 
        range: othersVariance > 0 ? [currentVal, currentVal + othersVariance] : [currentVal + othersVariance, currentVal], 
        color: othersVariance > 0 ? '#10b981' : '#ef4444', 
        value: othersVariance 
      });
      currentVal += othersVariance;
    }

    waterfallData.push({ name: 'Current GP', range: [0, currentVal], color: '#3b82f6', value: currentVal, isTotal: true });

    return {
      totalSales,
      totalGP,
      totalGPDelta: totalGP - budgetGP,
      totalQty,
      bookedSales,
      bookedGP,
      bookedQty,
      bookedSalesPercent,
      bookedGPPercent,
      bookedQtyPercent,
      salesVsBudget,
      gpVsBudget,
      qtyVsBudget,
      margin: totalSales > 0 ? (totalGP / totalSales) * 100 : 0,
      activeClientsCount,
      activeProductsCount,
      monthlyTrend,
      productMixVolume,
      productMixSales,
      paretoData,
      totalClientSales,
      waterfallData,
      countrySalesData,
      prevYearStr
    };
  }, [filteredData, baseFilteredData, selectedCategory, cycleYear, currentCycle, products]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const renderTrend = (value: number) => {
    const isPositive = value >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`text-sm font-medium ${color}`}>
        {isPositive ? '+' : ''}{value.toFixed(1)}% vs Budget
      </span>
    );
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Hide label for slices smaller than 5%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Executive Dashboard</h1>
          <p className="text-slate-500">Overview of current S&OP Forecast performance across all clients and products.</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <Filter size={18} className="text-slate-400" />
          
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Subsidiary:</label>
            <MultiSelect 
              options={subsidiaries}
              selectedValues={selectedSubsidiary}
              onChange={setSelectedSubsidiary}
              placeholder="Select Subsidiaries"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Sales Rep:</label>
            <MultiSelect 
              options={salesReps}
              selectedValues={selectedSalesRep}
              onChange={setSelectedSalesRep}
              placeholder="Select Reps"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Supplier:</label>
            <MultiSelect 
              options={suppliers}
              selectedValues={selectedSupplier}
              onChange={setSelectedSupplier}
              placeholder="Select Suppliers"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Client:</label>
            <MultiSelect 
              options={clientNames}
              selectedValues={selectedClient}
              onChange={setSelectedClient}
              placeholder="Select Clients"
            />
          </div>

          <button 
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-auto"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Annual Sales</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalSales)}</h3>
          <div className="mt-1 flex items-center gap-2">
            {renderTrend(stats.salesVsBudget)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Annual Gross Profit</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalGP)}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-slate-500">GP: {stats.margin.toFixed(1)}%</span>
            <span className="text-slate-300">|</span>
            {renderTrend(stats.gpVsBudget)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Users size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Scope</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800">{stats.activeClientsCount}</h3>
            <span className="text-sm text-slate-500">Clients</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-lg font-semibold text-slate-700">{stats.activeProductsCount}</h3>
            <span className="text-xs text-slate-500">Products</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Booked Orders (Confirmed)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Booked Sales</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.bookedSales)}</h3>
              <p className="text-sm text-slate-500 mt-1">out of {formatCurrency(stats.totalSales)}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">{stats.bookedSalesPercent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.bookedSalesPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Booked GP</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(stats.bookedGP)}</h3>
              <p className="text-sm text-slate-500 mt-1">out of {formatCurrency(stats.totalGP)}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-600">{stats.bookedGPPercent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.bookedGPPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Sales Trend (Budget vs Current vs Prev Year) */}
        <MaximizeWrapper title="Monthly Sales Trend (vs Budget & Prev Year)" className="h-full">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="sales" name="Total Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="budgetSales" name="Budget Sales" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="prevYearSales" name={`${stats.prevYearStr || 'Previous Year'} Sales Trend`} stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        {/* Monthly GP Trend (Budget vs Current vs Prev Year) */}
        <MaximizeWrapper title="Monthly GP Trend (vs Budget & Prev Year)" className="h-full">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="gp" name="Total GP" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="budgetGP" name="Budget GP" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="prevYearGP" name={`${stats.prevYearStr || 'Previous Year'} GP Trend`} stroke="#64748b" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      {/* Waterfall Chart */}
      <MaximizeWrapper title={`Top 5 Positive & Negative Drivers (GP Variance vs Budget) - Total Delta: Δ ${formatCurrency(stats.totalGPDelta)}`} className="mb-8">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} angle={-45} textAnchor="end" />
              <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                        <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                        <p className="text-sm font-medium" style={{ color: data.color }}>
                          {data.isTotal ? 'Total: ' : 'Variance: '} 
                          {formatCurrency(data.value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range" barSize={40}>
                {stats.waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </MaximizeWrapper>

      {/* Product Mix */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800">Product Mix – Volume & Value</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-600 whitespace-nowrap">Category:</label>
            <MultiSelect 
              options={categories}
              selectedValues={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select Categories"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MaximizeWrapper title="Product Mix – Volume" className="h-full">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productMixVolume} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="product" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    return [`${formatNumber(value)} MT (GP: ${props.payload.gpPercent.toFixed(1)}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="volume" name="Volume (MT)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </MaximizeWrapper>
          <MaximizeWrapper title="Product Mix – Value" className="h-full">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productMixSales} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="product" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    return [`${formatCurrency(value)} (GP: ${props.payload.gpPercent?.toFixed(1) || 0}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="sales" name="Sales (JOD)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </MaximizeWrapper>
        </div>
      </div>

      {/* Top Clients Pareto & Country Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <MaximizeWrapper title="Top Clients – Concentration & Mix" className="lg:col-span-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.paretoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tickFormatter={(val) => `JOD ${val / 1000}k`} domain={[0, stats.totalClientSales || 100]} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'Cumulative %') return [`${value.toFixed(1)}%`, name];
                    return [`${formatCurrency(value)} (GP: ${props.payload.gpPercent?.toFixed(1) || 0}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="sales" name="Sales (JOD)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Sales by Country" className="lg:col-span-1">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.countrySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {stats.countrySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    return [`${formatCurrency(value)} (GP: ${props.payload.gpPercent?.toFixed(1) || 0}%)`, name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>
    </div>
  );
};

export default DashboardScreen;
