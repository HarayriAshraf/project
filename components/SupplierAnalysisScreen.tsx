import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ForecastRecord, Product, Supplier, PurchaseOrder, POStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Legend, PieChart, Pie } from 'recharts';
import { MultiSelect } from './MultiSelect';
import { Filter, Truck, Globe, Clock, TrendingUp, DollarSign, Package } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  data: ForecastRecord[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
}

const SupplierAnalysisScreen: React.FC<Props> = ({ data, products, suppliers, purchaseOrders }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const subsidiaries = useMemo(() => {
    const validData = data.filter(d => {
      const sup = d.supplier || 'Unknown';
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(sup)) return false;
      const productInfo = products.find(p => p.name === d.product);
      const cat = productInfo?.category || d.category || 'Uncategorized';
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat)) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      return true;
    });
    const subs = new Set(validData.map(d => d.subsidiary).filter(Boolean));
    return Array.from(subs).sort();
  }, [data, products, selectedSupplier, selectedCategory, selectedSection]);

  const sections = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      const sup = d.supplier || 'Unknown';
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(sup)) return false;
      const productInfo = products.find(p => p.name === d.product);
      const cat = productInfo?.category || d.category || 'Uncategorized';
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat)) return false;
      return true;
    });
    const sects = new Set(validData.map(d => d.section || 'Unknown'));
    return Array.from(sects).sort();
  }, [data, products, selectedSubsidiary, selectedSupplier, selectedCategory]);

  const supplierNames = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      const productInfo = products.find(p => p.name === d.product);
      const cat = productInfo?.category || d.category || 'Uncategorized';
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat)) return false;
      return true;
    });
    const sups = new Set(validData.map(d => d.supplier || 'Unknown'));
    // Include all suppliers from the suppliers list just in case? Or only those in data?
    // Let's stick to the ones in filtered data.
    return Array.from(sups).sort();
  }, [data, products, selectedSubsidiary, selectedCategory]);

  const categories = useMemo(() => {
    const validData = data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;
      const sup = d.supplier || 'Unknown';
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(sup)) return false;
      return true;
    });
    const cats = new Set(validData.map(d => {
      const productInfo = products.find(p => p.name === d.product);
      return productInfo?.category || d.category || 'Uncategorized';
    }).filter(Boolean));
    return Array.from(cats).sort();
  }, [data, products, selectedSubsidiary, selectedSupplier]);

  useEffect(() => {
    if (!initialized && data.length > 0) {
      const allSubs = Array.from(new Set(data.map(d => d.subsidiary).filter(Boolean))).sort();
      const allSups = Array.from(new Set(data.map(d => d.supplier || 'Unknown')));
      suppliers.forEach(s => allSups.push(s.name));
      const uniqueSups = Array.from(new Set(allSups)).sort();
      
      const allCats = Array.from(new Set(data.map(d => {
        const productInfo = products.find(p => p.name === d.product);
        return productInfo?.category || d.category || 'Uncategorized';
      }).filter(Boolean))).sort();
      
      const allSects = Array.from(new Set(data.map(d => d.section || 'Unknown'))).sort();

      setSelectedSubsidiary(allSubs);
      setSelectedSupplier(uniqueSups);
      setSelectedCategory(allCats);
      setSelectedSection(allSects);
      setInitialized(true);
    }
  }, [data, suppliers, products, initialized]);

  const handleClearFilters = () => {
    const allSubs = Array.from(new Set(data.map(d => d.subsidiary).filter(Boolean))).sort();
    const allSups = Array.from(new Set(data.map(d => d.supplier || 'Unknown')));
    suppliers.forEach(s => allSups.push(s.name));
    const uniqueSups = Array.from(new Set(allSups)).sort();
    
    const allCats = Array.from(new Set(data.map(d => {
      const productInfo = products.find(p => p.name === d.product);
      return productInfo?.category || d.category || 'Uncategorized';
    }).filter(Boolean))).sort();

    const allSects = Array.from(new Set(data.map(d => d.section || 'Unknown'))).sort();

    setSelectedSubsidiary(allSubs);
    setSelectedSupplier(uniqueSups);
    setSelectedCategory(allCats);
    setSelectedSection(allSects);
  };

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedSubsidiary.length > 0 && !selectedSubsidiary.includes(d.subsidiary || 'Unassigned')) return false;
      if (selectedSection.length > 0 && !selectedSection.includes(d.section || 'Unknown')) return false;

      const sup = d.supplier || 'Unknown';
      if (selectedSupplier.length > 0 && !selectedSupplier.includes(sup)) return false;
      
      const productInfo = products.find(p => p.name === d.product);
      const cat = productInfo?.category || d.category || 'Uncategorized';
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat)) return false;

      return true;
    });
  }, [data, products, selectedSubsidiary, selectedSupplier, selectedCategory]);

  const stats = useMemo(() => {
    const currentData = filteredData.filter(d => d.status === 'Forecasted' || d.status === 'Booked' || d.status === 'Draft');
    const budgetData = filteredData.filter(d => d.status === 'Budget');

    // 1. Supplier Concentration (Pareto) & Profitability
    const supplierMap: Record<string, { sales: number, gp: number, volume: number, budgetSales: number, budgetGP: number, products: Set<string> }> = {};
    
    currentData.forEach(rec => {
      const sup = rec.supplier || 'Unknown';
      if (!supplierMap[sup]) supplierMap[sup] = { sales: 0, gp: 0, volume: 0, budgetSales: 0, budgetGP: 0, products: new Set() };
      supplierMap[sup].sales += rec.sales;
      supplierMap[sup].gp += rec.gp;
      supplierMap[sup].volume += rec.qty;
      supplierMap[sup].products.add(rec.product);
    });

    budgetData.forEach(rec => {
      const sup = rec.supplier || 'Unknown';
      if (!supplierMap[sup]) supplierMap[sup] = { sales: 0, gp: 0, volume: 0, budgetSales: 0, budgetGP: 0, products: new Set() };
      supplierMap[sup].budgetSales += rec.sales;
      supplierMap[sup].budgetGP += rec.gp;
    });

    const allSortedSuppliers = Object.entries(supplierMap)
      .map(([name, vals]) => ({ 
        name, 
        sales: vals.sales, 
        gp: vals.gp, 
        volume: vals.volume,
        budgetSales: vals.budgetSales,
        budgetGP: vals.budgetGP,
        gpPercent: vals.sales > 0 ? (vals.gp / vals.sales) * 100 : 0,
        productCount: vals.products.size
      }))
      .sort((a, b) => b.sales - a.sales);

    const topSuppliers = allSortedSuppliers.slice(0, 10);
    const otherSuppliers = allSortedSuppliers.slice(10);
    if (otherSuppliers.length > 0) {
      const othersSales = otherSuppliers.reduce((sum, s) => sum + s.sales, 0);
      const othersGP = otherSuppliers.reduce((sum, s) => sum + s.gp, 0);
      const othersVolume = otherSuppliers.reduce((sum, s) => sum + s.volume, 0);
      topSuppliers.push({ 
        name: 'Others', 
        sales: othersSales, 
        gp: othersGP, 
        volume: othersVolume,
        budgetSales: 0,
        budgetGP: 0,
        gpPercent: othersSales > 0 ? (othersGP / othersSales) * 100 : 0,
        productCount: 0
      });
    }

    let cumulativeSales = 0;
    const totalSupplierSales = allSortedSuppliers.reduce((sum, s) => sum + s.sales, 0);
    const paretoData = topSuppliers.map(s => {
      cumulativeSales += s.sales;
      return {
        ...s,
        cumulativePercent: totalSupplierSales > 0 ? (cumulativeSales / totalSupplierSales) * 100 : 0
      };
    });

    // 2. Geographic Risk Analysis
    const countryMap: Record<string, number> = {};
    currentData.forEach(rec => {
      const supName = rec.supplier || 'Unknown';
      const supplierInfo = suppliers.find(s => s.name === supName);
      const country = supplierInfo?.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + rec.sales;
    });
    const geographicData = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 3. Lead Time & Reliability
    const getReliabilityScore = (supplierName: string) => {
      const supplier = suppliers.find(s => s.name === supplierName);
      if (!supplier) return 100;
      const pos = purchaseOrders.filter(po => po.supplierId === supplier.id && po.status === POStatus.DELIVERED);
      if (pos.length === 0) return 100; // Default if no delivered POs
      const onTime = pos.filter(po => new Date(po.actualDeliveryDate!) <= new Date(po.expectedDeliveryDate)).length;
      return Math.round((onTime / pos.length) * 100);
    };

    const leadTimeDataMap: Record<string, { total: number, count: number }> = {};
    purchaseOrders.forEach(po => {
      const sup = suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown';
      let lt = po.leadTimeWeeks;
      if (lt === undefined) {
        const prod = products.find(p => p.id === po.productId);
        lt = prod ? prod.leadTimeWeeks : 0;
      }
      if (lt > 0) {
        if (!leadTimeDataMap[sup]) leadTimeDataMap[sup] = { total: 0, count: 0 };
        leadTimeDataMap[sup].total += lt;
        leadTimeDataMap[sup].count += 1;
      }
    });

    const leadTimeData = Object.entries(leadTimeDataMap).map(([sup, data]) => ({
      supplier: sup,
      avgLeadTime: data.count > 0 ? data.total / data.count : 0,
      reliabilityScore: getReliabilityScore(sup)
    })).filter(d => d.avgLeadTime > 0).sort((a, b) => b.avgLeadTime - a.avgLeadTime).slice(0, 10);

    return {
      paretoData,
      allSortedSuppliers,
      geographicData,
      leadTimeData,
      totalSales: totalSupplierSales
    };
  }, [filteredData, suppliers, products, purchaseOrders, selectedSupplier]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(val);
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b', '#14b8a6'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Supplier Analysis</h1>
          <p className="text-slate-500">Deep dive into supplier performance, concentration, and risk.</p>
        </div>
        
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
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Section:</label>
            <MultiSelect 
              options={sections}
              selectedValues={selectedSection}
              onChange={setSelectedSection}
              placeholder="Select Sections"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Supplier:</label>
            <MultiSelect 
              options={supplierNames}
              selectedValues={selectedSupplier}
              onChange={setSelectedSupplier}
              placeholder="Select Suppliers"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 text-sm whitespace-nowrap">Category:</label>
            <MultiSelect 
              options={categories}
              selectedValues={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select Categories"
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

      {/* Top Row: Pareto & Geographic Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <MaximizeWrapper title="Supplier Concentration (Pareto)" className="lg:col-span-2">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.paretoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tickFormatter={(val) => `JOD ${val / 1000}k`} />
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

        <MaximizeWrapper title="Geographic Risk (Sales by Country)" className="lg:col-span-1">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.geographicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {stats.geographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      {/* Middle Row: Profitability & Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MaximizeWrapper title="Profitability by Supplier (GP%)">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.allSortedSuppliers.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [`${value.toFixed(1)}% (GP: ${formatCurrency(props.payload.gp)})`, 'GP %']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="gpPercent" name="GP %" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.allSortedSuppliers.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gpPercent > 20 ? '#10b981' : entry.gpPercent > 10 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Supplier vs. Budget Performance">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.allSortedSuppliers.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                <YAxis tickFormatter={(val) => `JOD ${val / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" />
                <Bar dataKey="sales" name="Actual Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="budgetSales" name="Budget Sales" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      {/* Bottom Row: Lead Time */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <MaximizeWrapper title="Lead Time & Reliability by Supplier">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.leadTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="supplier" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 11}} />
                <YAxis yAxisId="left" label={{ value: 'Weeks', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'Reliability Score') return [`${value}%`, name];
                    return [`${value.toFixed(1)} Weeks`, name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="top" />
                <Bar yAxisId="left" dataKey="avgLeadTime" name="Avg Lead Time (Weeks)" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="reliabilityScore" name="Reliability Score" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>
    </div>
  );
};

export default SupplierAnalysisScreen;
