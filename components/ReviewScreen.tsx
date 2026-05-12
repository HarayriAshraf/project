import React, { useState, useMemo } from "react";
import { MaximizeWrapper } from './MaximizeWrapper';
import {
  ForecastRecord,
  BudgetRatio,
  AuditLog,
  ForecastStatus,
  Product,
  Supplier,
} from "../types";
import {
  Edit2,
  Save,
  XCircle,
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Plus,
  Calendar,
  DollarSign,
  Package,
  Percent,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  ClipboardCheck,
} from "lucide-react";

import { MultiSelect } from './MultiSelect';

interface Props {
  data: ForecastRecord[];
  products: Product[];
  suppliers: Supplier[];
  client: string;
  section: string;
  subsidiary: string;
  currentUserEmail: string;
  currentUserName: string;
  currentCycle: string;
  onUpdateData: (records: ForecastRecord[], auditLogs: AuditLog[]) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const REASONS = [
  "New business",
  "Increased demand",
  "High prices",
  "Competition",
  "Credit limit issues",
  "Market Downturn",
  "Customer Request",
  "Already Booked",
  "Supplier Limitations",
  "Other"
];

const ReviewScreen: React.FC<Props> = ({
  data,
  products,
  suppliers,
  client,
  section,
  subsidiary,
  currentUserEmail,
  currentUserName,
  currentCycle,
  onUpdateData,
  onBack,
  onSubmit,
}) => {
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

  // Local state for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editMonth, setEditMonth] = useState<number>(0);
  const [editYear, setEditYear] = useState<number>(0);
  const [editSupplier, setEditSupplier] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [editRecordType, setEditRecordType] = useState<
    "Baseline" | "NPI"
  >("Baseline");

  // Local state for adding
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  
  // S&OP Table Filters
  const [sopFilters, setSopFilters] = useState({
    orderRef: '',
    product: '',
    type: '',
    supplier: '',
    period: '',
    status: ''
  });
  const [newRecord, setNewRecord] = useState<{
    product: string;
    month: number;
    year: number;
    qty: number;
    supplier?: string;
    manualSalesPMT?: number;
    manualCostPMT?: number;
    manualGpPMT?: number;
    recordType: "Baseline" | "NPI";
  }>({
    product: "",
    month: new Date().getMonth() + 1,
    year: currentYear,
    qty: 0,
    supplier: "",
    recordType: "Baseline",
  });

  // Filter for relevant data
  const filteredData = useMemo(() => {
    return data.filter(
      (d) =>
        d.client === client &&
        d.section === section &&
        d.subsidiary === subsidiary &&
        (filterSupplier.length === 0 || filterSupplier.includes(d.supplier || 'Unassigned'))
    );
  }, [data, client, section, subsidiary, filterSupplier]);

  // Derived lists for dropdowns
  const availableProducts = useMemo(() => {
    return products.map((p) => p.name).sort();
  }, [products]);
  const availableSuppliers = useMemo(() => {
    const supps = new Set(data.filter(d => d.client === client && d.section === section && d.subsidiary === subsidiary).map(d => d.supplier).filter(Boolean));
    return Array.from(supps).sort();
  }, [data, client, section, subsidiary]);
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map((d) => d.year))).sort();
    return years.length ? years : [currentYear];
  }, [data, currentYear]);

  // Calculate Budget Ratios (Sales per MT, GP per MT) for each product based on THIS CLIENT'S history AND specific month/year
  const budgetRatios = useMemo(() => {
    const monthlyRatios = new Map<string, BudgetRatio>();
    const yearlyRatios = new Map<string, BudgetRatio>();

    const budgetItems = filteredData.filter((d) => d.status === "Budget");
    const monthlyGroups = new Map<
      string,
      { totalQty: number; totalSales: number; totalGP: number }
    >();
    const yearlyGroups = new Map<
      string,
      { totalQty: number; totalSales: number; totalGP: number }
    >();

    budgetItems.forEach((item) => {
      const monthlyKey = `${item.product}-${item.year}-${item.month}`;
      const yearlyKey = `${item.product}-${item.year}`;

      const currentMonthly = monthlyGroups.get(monthlyKey) || {
        totalQty: 0,
        totalSales: 0,
        totalGP: 0,
      };
      currentMonthly.totalQty += item.qty;
      currentMonthly.totalSales += item.sales;
      currentMonthly.totalGP += item.gp;
      monthlyGroups.set(monthlyKey, currentMonthly);

      const currentYearly = yearlyGroups.get(yearlyKey) || {
        totalQty: 0,
        totalSales: 0,
        totalGP: 0,
      };
      currentYearly.totalQty += item.qty;
      currentYearly.totalSales += item.sales;
      currentYearly.totalGP += item.gp;
      yearlyGroups.set(yearlyKey, currentYearly);
    });

    monthlyGroups.forEach((totals, key) => {
      if (totals.totalQty > 0) {
        monthlyRatios.set(key, {
          salesPerMT: totals.totalSales / totals.totalQty,
          gpPerMT: totals.totalGP / totals.totalQty,
        });
      }
    });

    yearlyGroups.forEach((totals, key) => {
      if (totals.totalQty > 0) {
        yearlyRatios.set(key, {
          salesPerMT: totals.totalSales / totals.totalQty,
          gpPerMT: totals.totalGP / totals.totalQty,
        });
      }
    });

    return { monthlyRatios, yearlyRatios };
  }, [filteredData]);

  // Separate and Sort Data
  const unfilteredSopData = useMemo(() => {
    return filteredData
      .filter((d) => (d.status === "Forecasted" || d.status === "Draft") && Number(d.year) === currentYear)
      .sort((a, b) => {
        if (a.product !== b.product) return a.product.localeCompare(b.product);
        return a.month - b.month;
      });
  }, [filteredData, currentYear]);

  const sopData = useMemo(() => {
    return unfilteredSopData
      .filter((d) => {
        if (sopFilters.orderRef && !(d.orderReference || '').toLowerCase().includes(sopFilters.orderRef.toLowerCase())) return false;
        if (sopFilters.product && !d.product.toLowerCase().includes(sopFilters.product.toLowerCase())) return false;
        if (sopFilters.type && !(d.recordType || 'Baseline').toLowerCase().includes(sopFilters.type.toLowerCase())) return false;
        if (sopFilters.supplier && !(d.supplier || '').toLowerCase().includes(sopFilters.supplier.toLowerCase())) return false;
        if (sopFilters.period && !`${d.year}-${String(d.month).padStart(2, '0')}`.includes(sopFilters.period)) return false;
        if (sopFilters.status && !d.status.toLowerCase().includes(sopFilters.status.toLowerCase())) return false;
        return true;
      });
  }, [unfilteredSopData, sopFilters]);

  const budgetData = useMemo(() => {
    return filteredData
      .filter((d) => d.status === "Budget" && Number(d.year) === currentYear)
      .sort((a, b) => {
        if (a.product !== b.product) return a.product.localeCompare(b.product);
        return a.month - b.month;
      });
  }, [filteredData, currentYear]);

  const bookedData = useMemo(() => {
    return filteredData
      .filter((d) => d.status === "Booked" && Number(d.year) === currentYear)
      .sort((a, b) => {
        if (a.product !== b.product) return a.product.localeCompare(b.product);
        return a.month - b.month;
      });
  }, [filteredData, currentYear]);

  // --- KPI CALCULATIONS ---
  const isBroker = section === 'Broker' || client === 'Broker';

  const kpiStats = useMemo(() => {
    const calculateMetrics = (dataset: ForecastRecord[]) => {
      // Use fallback to 0 to prevent NaNs if data is malformed
      const totalQty = dataset.reduce((sum, item) => sum + (item.qty || 0), 0);
      const totalSales = dataset.reduce(
        (sum, item) => sum + (item.sales || 0),
        0,
      );
      const totalGP = dataset.reduce((sum, item) => sum + (item.gp || 0), 0);
      return {
        qty: totalQty,
        sales: totalSales,
        gp: totalGP,
        gpPercent: totalSales > 0 ? (totalGP / totalSales) * 100 : 0,
        avgPrice: totalQty > 0 ? totalSales / totalQty : 0,
      };
    };

    // Use unfilteredSopData for KPIs so they don't change when table is filtered
    const current = calculateMetrics([...unfilteredSopData, ...bookedData]);
    const baseline = calculateMetrics(budgetData);
    const booked = calculateMetrics(bookedData);

    return { current, baseline, booked };
  }, [unfilteredSopData, budgetData, bookedData]);

  const monthlySummary = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return months.map((month, index) => {
      const sopSales = unfilteredSopData.filter(d => d.month === month).reduce((sum, d) => sum + (d.sales || 0), 0);
      const budgetSales = budgetData.filter(d => d.month === month).reduce((sum, d) => sum + (d.sales || 0), 0);
      const sopGp = unfilteredSopData.filter(d => d.month === month).reduce((sum, d) => sum + (d.gp || 0), 0);
      const budgetGp = budgetData.filter(d => d.month === month).reduce((sum, d) => sum + (d.gp || 0), 0);
      
      const valSop = isBroker ? sopGp : sopSales;
      const valBudget = isBroker ? budgetGp : budgetSales;
      const variance = valBudget > 0 ? ((valSop - valBudget) / valBudget) * 100 : 0;
      
      return {
        month: monthNames[index],
        sopSales,
        budgetSales,
        sopGp,
        budgetGp,
        variance
      };
    });
  }, [unfilteredSopData, budgetData, isBroker]);

  const totalSopSales = monthlySummary.reduce((sum, m) => sum + m.sopSales, 0);
  const totalBudgetSales = monthlySummary.reduce((sum, m) => sum + m.budgetSales, 0);
  const totalSopGp = monthlySummary.reduce((sum, m) => sum + m.sopGp, 0);
  const totalBudgetGp = monthlySummary.reduce((sum, m) => sum + m.budgetGp, 0);
  
  const totalValSop = isBroker ? totalSopGp : totalSopSales;
  const totalValBudget = isBroker ? totalBudgetGp : totalBudgetSales;
  const totalVariance = totalValBudget > 0 ? ((totalValSop - totalValBudget) / totalValBudget) * 100 : 0;

  const sopTableTotals = useMemo(() => {
    const qty = sopData.reduce((sum, item) => sum + (item.qty || 0), 0);
    const sales = sopData.reduce((sum, item) => sum + (item.sales || 0), 0);
    const gp = sopData.reduce((sum, item) => sum + (item.gp || 0), 0);
    return { qty, sales, gp };
  }, [sopData]);

  const renderKPICard = (
    title: string,
    icon: React.ReactNode,
    value: string,
    currentRaw: number,
    baselineRaw: number,
    isPercentage: boolean = false,
    bookedRaw?: number,
  ) => {
    const isPositive = currentRaw >= baselineRaw;
    // For GP% and AvgPrice, we might want to color code differently? (Higher is better for GP/Price usually)
    // For now, Green = Increase, Red = Decrease relative to budget.

    const achievement =
      baselineRaw !== 0
        ? Math.round(((currentRaw - baselineRaw) / Math.abs(baselineRaw)) * 100)
        : currentRaw > 0
          ? 100
          : 0;

    const bookedPercentage =
      bookedRaw !== undefined && currentRaw > 0
        ? Math.round((bookedRaw / currentRaw) * 100)
        : 0;

    // For formatting trend text
    const trendColor = isPositive ? "text-green-600" : "text-red-600";
    const TrendIcon = isPositive ? ArrowUp : ArrowDown;
    const neutral = baselineRaw === 0;

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
            {title}
          </div>
          <div
            className={`p-1.5 rounded-lg ${isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {icon}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
            {value}
            {bookedRaw !== undefined && (
              <span className="text-sm font-medium text-slate-500">
                ({bookedPercentage}% booked)
              </span>
            )}
          </div>
          {!neutral ? (
            <div
              className={`flex items-center gap-1 text-xs font-medium mt-1 ${trendColor}`}
            >
              <TrendIcon size={12} strokeWidth={3} />
              <span>
                {achievement > 0 ? "+" : ""}
                {achievement}% vs Budget
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Minus size={12} /> No Budget
            </div>
          )}
        </div>
      </div>
    );
  };
  // ------------------------

  // Actions
  const startEdit = (record: ForecastRecord) => {
    setEditingId(record.id);
    setEditQty(record.qty);
    setEditMonth(record.month);
    setEditYear(record.year);
    setEditSupplier(record.supplier || "");
    setEditReason("");
    setEditRecordType(record.recordType || "Baseline");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQty(0);
    setEditMonth(0);
    setEditYear(0);
    setEditSupplier("");
    setEditReason("");
    setEditRecordType("Baseline");
  };

  const handleSave = () => {
    if (!editingId || !editReason) {
      setEditError("Please select a Reason Code before saving.");
      return;
    }
    setEditError(null);

    const record = data.find((d) => d.id === editingId);
    if (!record) return;

    const monthlyKey = `${record.product}-${editYear}-${editMonth}`;
    const yearlyKey = `${record.product}-${editYear}`;
    const ratio = budgetRatios.monthlyRatios.get(monthlyKey) ||
      budgetRatios.yearlyRatios.get(yearlyKey) || { salesPerMT: 0, gpPerMT: 0 };

    // Recalculate based on Budget Logic if available, else keep ratio or warn
    const currentPrice = record.qty > 0 ? record.sales / record.qty : 0;
    const currentGPMargin = record.qty > 0 ? record.gp / record.qty : 0;

    const usedPrice = ratio.salesPerMT || currentPrice;
    const usedGP = ratio.gpPerMT || currentGPMargin;

    const newSales = section === 'Broker' ? 0 : editQty * usedPrice;
    const newGP = editQty * usedGP;

    const updatedRecord: ForecastRecord = {
      ...record,
      qty: editQty,
      month: editMonth,
      year: editYear,
      supplier: editSupplier,
      sales: newSales,
      gp: newGP,
      status: "Forecasted",
      workflowStatus: ForecastStatus.DRAFT,
      recordType: editRecordType,
    };

    const auditLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
      recordId: record.id,
      product: record.product,
      actionType: "AMEND",
      reasonCode: editReason,
      details: `Qty changed from ${record.qty} to ${editQty}. Period changed from ${record.year}-${record.month} to ${editYear}-${editMonth}.`,
      client: record.client,
      subsidiary: record.subsidiary,
      section: record.section,
      salesRep: record.salesPerson,
      month: editMonth,
      year: editYear,
      previousMonth: record.month,
      previousYear: record.year,
      previousQty: record.qty,
      newQty: editQty,
      previousSales: record.sales,
      newSales: updatedRecord.sales,
      previousGP: record.gp,
      newGP: updatedRecord.gp,
    };

    const newData = data.map((d) => (d.id === editingId ? updatedRecord : d));
    onUpdateData(newData, [auditLog]);

    cancelEdit();
  };

  const handleDelete = (record: ForecastRecord) => {
    const reason = prompt(
      "Select reason for deletion/conversion (Simulated dropdown):\n" + REASONS.join(", "),
    );
    if (!reason) return;

    const isBooked = reason === "Already Booked";

    const updatedRecord: ForecastRecord = {
      ...record,
      qty: isBooked ? record.qty : 0,
      sales: isBooked ? record.sales : 0,
      gp: isBooked ? record.gp : 0,
      status: isBooked ? "Booked" : "Forecasted",
      workflowStatus: isBooked ? ForecastStatus.APPROVED : ForecastStatus.ARCHIVED,
    };

    const auditLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
      recordId: record.id,
      product: record.product,
      actionType: isBooked ? "AMEND" : "DELETE",
      reasonCode: reason,
      details: isBooked ? `Converted to Booked` : `Record cleared/soft-deleted. Previous Qty: ${record.qty}`,
      client: record.client,
      subsidiary: record.subsidiary,
      section: record.section,
      salesRep: record.salesPerson,
      month: record.month,
      year: record.year,
      previousMonth: record.month,
      previousYear: record.year,
      previousQty: record.qty,
      newQty: updatedRecord.qty,
      previousSales: record.sales,
      newSales: updatedRecord.sales,
      previousGP: record.gp,
      newGP: updatedRecord.gp,
    };

    const newData = data.map((d) => (d.id === record.id ? updatedRecord : d));
    onUpdateData(newData, [auditLog]);
  };

  // NEW: Handle Add Logic
  const handleAddNew = () => {
    if (!newRecord.product) {
      setAddError("Select a product");
      return;
    }
    if (newRecord.qty <= 0) {
      setAddError("Qty > 0 required");
      return;
    }
    setAddError(null);

    const monthlyKey = `${newRecord.product}-${newRecord.year}-${newRecord.month}`;
    const yearlyKey = `${newRecord.product}-${newRecord.year}`;
    const ratio =
      budgetRatios.monthlyRatios.get(monthlyKey) ||
      budgetRatios.yearlyRatios.get(yearlyKey);
    const hasBudget = ratio && (section === 'Broker' ? ratio.gpPerMT > 0 : ratio.salesPerMT > 0);

    let finalSales = 0;
    let finalGP = 0;

    if (hasBudget) {
      finalSales = section === 'Broker' ? 0 : newRecord.qty * ratio.salesPerMT;
      finalGP = newRecord.qty * ratio.gpPerMT;
    } else {
      if (section === 'Broker') {
        const gpPMT = newRecord.manualGpPMT || 0;
        finalSales = 0;
        finalGP = newRecord.qty * gpPMT;
      } else {
        const salesPMT = newRecord.manualSalesPMT || 0;
        const costPMT = newRecord.manualCostPMT || 0;
        finalSales = newRecord.qty * salesPMT;
        finalGP = salesPMT * newRecord.qty - costPMT * newRecord.qty;
      }
    }

    const newId = `new-${Date.now()}`;

    // Generate a unique reference number for this specific order
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderRef = `WF-${dateStr}-${randomStr}`;

    const newEntry: ForecastRecord = {
      id: newId,
      client,
      section,
      subsidiary,
      country: filteredData[0]?.country || "Unknown",
      product: newRecord.product,
      category:
        filteredData.find((d) => d.product === newRecord.product)?.category ||
        "General",
      month: newRecord.month,
      year: newRecord.year,
      version: currentCycle,
      qty: newRecord.qty,
      supplier: newRecord.supplier,
      sales: finalSales,
      gp: finalGP,
      salesPerson: filteredData[0]?.salesPerson || currentUserName,
      salesPersonEmail: currentUserEmail,
      status: "Forecasted",
      workflowStatus: ForecastStatus.DRAFT,
      orderReference: orderRef,
      recordType: newRecord.recordType,
    };

    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
      recordId: newId,
      product: newRecord.product,
      actionType: "AMEND", // effectively adding is an amendment to the plan
      reasonCode: "New Business",
      details: `Added new record. Qty: ${newEntry.qty}`,
      client: newEntry.client,
      subsidiary: newEntry.subsidiary,
      section: newEntry.section,
      salesRep: newEntry.salesPerson,
      month: newEntry.month,
      year: newEntry.year,
      previousQty: 0,
      newQty: newEntry.qty,
      previousSales: 0,
      newSales: newEntry.sales,
      previousGP: 0,
      newGP: newEntry.gp,
    };

    onUpdateData([...data, newEntry], [log]);

    // Reset form
    setNewRecord({
      ...newRecord,
      qty: 0,
      manualSalesPMT: 0,
      manualCostPMT: 0,
      manualGpPMT: 0,
      supplier: "",
    });
    setIsAdding(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-JO", {
      style: "currency",
      currency: "JOD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      val,
    );
  };

  // Check if selected product in Add Form has budget
  const selectedProductHasBudget = useMemo(() => {
    if (!newRecord.product) return true; // default hidden
    const monthlyKey = `${newRecord.product}-${newRecord.year}-${newRecord.month}`;
    const yearlyKey = `${newRecord.product}-${newRecord.year}`;
    const r =
      budgetRatios.monthlyRatios.get(monthlyKey) ||
      budgetRatios.yearlyRatios.get(yearlyKey);
    return !!(r && (section === 'Broker' ? r.gpPerMT > 0 : r.salesPerMT > 0));
  }, [newRecord.product, newRecord.year, newRecord.month, budgetRatios, section]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{client}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Section: {section}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>Subsidiary: {subsidiary}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <MultiSelect
              options={availableSuppliers}
              selectedValues={filterSupplier}
              onChange={setFilterSupplier}
              placeholder="All Suppliers"
            />
          </div>
          <button
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            Finish & Submit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto max-w-[100vw] space-y-8">
        {/* KPI Dashboard */}
        <div className={`grid grid-cols-1 ${isBroker ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-4 animate-in fade-in slide-in-from-top-4 duration-500`}>
          {!isBroker && renderKPICard(
            "Total Revenue",
            <DollarSign size={18} />,
            formatCurrency(kpiStats.current.sales),
            kpiStats.current.sales,
            kpiStats.baseline.sales,
            false,
            kpiStats.booked.sales,
          )}
          {renderKPICard(
            "Total Volume (MT)",
            <Package size={18} />,
            formatNumber(kpiStats.current.qty),
            kpiStats.current.qty,
            kpiStats.baseline.qty,
            false,
            kpiStats.booked.qty,
          )}
          {isBroker && renderKPICard(
            "Total GP Value",
            <DollarSign size={18} />,
            formatCurrency(kpiStats.current.gp),
            kpiStats.current.gp,
            kpiStats.baseline.gp,
            false,
            kpiStats.booked.gp,
          )}
          {!isBroker && renderKPICard(
            "Gross Margin %",
            <Percent size={18} />,
            `${kpiStats.current.gpPercent.toFixed(2)}%`,
            kpiStats.current.gpPercent,
            kpiStats.baseline.gpPercent,
            true,
          )}
          {!isBroker && renderKPICard(
            "Avg. Price / MT",
            <BarChart3 size={18} />,
            formatCurrency(kpiStats.current.avgPrice),
            kpiStats.current.avgPrice,
            kpiStats.baseline.avgPrice,
          )}
        </div>

        {/* Monthly Summary Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Monthly {isBroker ? 'GP' : 'Sales'} Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-left font-medium border-b border-slate-200">Metric</th>
                  {monthlySummary.map(m => (
                    <th key={m.month} className="p-3 font-medium border-b border-slate-200">{m.month}</th>
                  ))}
                  <th className="p-3 font-medium border-b border-slate-200">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 text-left font-medium text-slate-700">S&OP</td>
                  {monthlySummary.map(m => (
                    <td key={m.month} className="p-3">
                      <div className="text-slate-700">{formatNumber(isBroker ? m.sopGp : m.sopSales)}</div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${m.variance > 0 ? 'text-green-600' : m.variance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {m.variance > 0 ? '+' : ''}{m.variance.toFixed(1)}%
                      </div>
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{formatNumber(isBroker ? totalSopGp : totalSopSales)}</div>
                    <div className={`text-[10px] font-bold mt-0.5 ${totalVariance > 0 ? 'text-green-600' : totalVariance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(1)}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 text-left font-medium text-slate-700">Budget</td>
                  {monthlySummary.map(m => (
                    <td key={m.month} className="p-3 text-slate-500">{formatNumber(isBroker ? m.budgetGp : m.budgetSales)}</td>
                  ))}
                  <td className="p-3 font-bold text-slate-600">{formatNumber(isBroker ? totalBudgetGp : totalBudgetSales)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Booked Orders Section */}
        <div className="space-y-4">
          <MaximizeWrapper title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-lg font-bold text-emerald-700">
                <ClipboardCheck className="h-5 w-5" />
                <span>Booked Orders (On Hand)</span>
                <span className="text-xs font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Reference Only
                </span>
              </div>
              <div className="flex gap-4 text-sm font-medium text-emerald-700 bg-emerald-100/50 px-4 py-2 rounded-lg border border-emerald-200">
                <div>Volume: <span className="text-emerald-900">{formatNumber(kpiStats.booked.qty)} MT</span></div>
                {!isBroker && <div>Sales: <span className="text-emerald-900">{formatCurrency(kpiStats.booked.sales)}</span></div>}
                <div>GP: <span className="text-emerald-900">{formatCurrency(kpiStats.booked.gp)}</span></div>
              </div>
            </div>
          } className="bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden opacity-95">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-100 text-emerald-800 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4 border-b border-emerald-200">Order Ref</th>
                  <th className="p-4 border-b border-emerald-200">Product</th>
                  <th className="p-4 border-b border-emerald-200">Type</th>
                  <th className="p-4 border-b border-emerald-200">Supplier</th>
                  <th className="p-4 border-b border-emerald-200">Period</th>
                  <th className="p-4 border-b border-emerald-200 text-right">
                    Qty (MT)
                  </th>
                  <th className="p-4 border-b border-emerald-200 text-right">
                    Sales
                  </th>
                  <th className="p-4 border-b border-emerald-200 text-right">
                    GP
                  </th>
                  <th className="p-4 border-b border-emerald-200 text-right">
                    GP %
                  </th>
                  <th className="p-4 border-b border-emerald-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-sm text-emerald-800">
                {bookedData.map((row) => (
                  <tr key={row.id}>
                    <td className="p-4 font-mono text-xs text-emerald-700">
                      {row.orderReference || "-"}
                    </td>
                    <td className="p-4 font-medium">{row.product}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.recordType === 'NPI' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {row.recordType || 'Baseline'}
                      </span>
                    </td>
                    <td className="p-4">{row.supplier || "-"}</td>
                    <td className="p-4">
                      {row.year}-{String(row.month).padStart(2, "0")}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {row.qty.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {formatCurrency(row.sales)}
                    </td>
                    <td className="p-4 text-right">{formatCurrency(row.gp)}</td>
                    <td className="p-4 text-right">
                      {row.sales > 0
                        ? ((row.gp / row.sales) * 100).toFixed(1) + "%"
                        : "0.0%"}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-200 text-emerald-800">
                        {row.workflowStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="p-8 text-center text-emerald-600 italic"
                    >
                      No Booked Orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </MaximizeWrapper>
        </div>

        {/* S&OP Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2 text-lg font-bold text-blue-800">
              <TrendingUp className="h-5 w-5" />
              <h2>Working Forecast (S&OP)</h2>
              <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Editable
              </span>
            </div>

            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-sm flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <Plus size={16} /> Add Forecast
              </button>
            )}
          </div>

          {/* Add New Record Form */}
          {isAdding && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Plus size={14} /> New Entry
                </h3>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setAddError(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {addError && (
                <div className="mb-3 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-blue-800 mb-1">
                    Product
                  </label>
                  <select
                    value={newRecord.product}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, product: e.target.value })
                    }
                    className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Product...</option>
                    {availableProducts.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-800 mb-1">
                    Supplier
                  </label>
                  <select
                    value={newRecord.supplier}
                    onChange={(e) =>
                      setNewRecord({ ...newRecord, supplier: e.target.value })
                    }
                    className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-2/3">
                    <label className="block text-xs font-semibold text-blue-800 mb-1">
                      Month
                    </label>
                    <select
                      value={newRecord.month}
                      onChange={(e) =>
                        setNewRecord({
                          ...newRecord,
                          month: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1, 1).toLocaleString("default", {
                            month: "short",
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/3">
                    <label className="block text-xs font-semibold text-blue-800 mb-1">
                      Year
                    </label>
                    <select
                      value={newRecord.year}
                      onChange={(e) =>
                        setNewRecord({
                          ...newRecord,
                          year: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                    >
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-800 mb-1">
                    Quantity (MT)
                  </label>
                  <input
                    type="number"
                    value={newRecord.qty}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        qty: Number(e.target.value),
                      })
                    }
                    className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-800 mb-1">
                    Type
                  </label>
                  <select
                    value={newRecord.recordType}
                    onChange={(e) =>
                      setNewRecord({
                        ...newRecord,
                        recordType: e.target.value as any,
                      })
                    }
                    className="w-full text-sm p-2 border border-blue-200 rounded focus:border-blue-500 outline-none"
                  >
                    <option value="Baseline">Baseline</option>
                    <option value="NPI">NPI</option>
                  </select>
                </div>

                {/* Dynamic Sales/GP fields if no budget */}
                {!selectedProductHasBudget && section !== 'Broker' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-orange-700 mb-1">
                        Est. Sales PMT (JOD)
                      </label>
                      <input
                        type="number"
                        value={newRecord.manualSalesPMT || ""}
                        onChange={(e) =>
                          setNewRecord({
                            ...newRecord,
                            manualSalesPMT: Number(e.target.value),
                          })
                        }
                        className="w-full text-sm p-2 border border-orange-300 bg-orange-50 rounded focus:border-orange-500 outline-none"
                        placeholder="No budget found"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-orange-700 mb-1">
                        Est. Cost PMT (JOD)
                      </label>
                      <input
                        type="number"
                        value={newRecord.manualCostPMT || ""}
                        onChange={(e) =>
                          setNewRecord({
                            ...newRecord,
                            manualCostPMT: Number(e.target.value),
                          })
                        }
                        className="w-full text-sm p-2 border border-orange-300 bg-orange-50 rounded focus:border-orange-500 outline-none"
                        placeholder="No budget found"
                      />
                    </div>
                  </>
                )}
                {!selectedProductHasBudget && section === 'Broker' && (
                  <div>
                    <label className="block text-xs font-semibold text-orange-700 mb-1">
                      Est. GP PMT (JOD)
                    </label>
                    <input
                      type="number"
                      value={newRecord.manualGpPMT || ""}
                      onChange={(e) =>
                        setNewRecord({
                          ...newRecord,
                          manualGpPMT: Number(e.target.value),
                        })
                      }
                      className="w-full text-sm p-2 border border-orange-300 bg-orange-50 rounded focus:border-orange-500 outline-none"
                      placeholder="No budget found"
                    />
                  </div>
                )}

                {selectedProductHasBudget && (
                  <div className="col-span-2 flex items-center h-full pb-2">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      Budget pricing applied automatically
                    </span>
                  </div>
                )}

                <div>
                  <button
                    onClick={handleAddNew}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded shadow transition"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          <MaximizeWrapper title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-lg font-bold text-blue-800">
                <span>S&OP Forecast</span>
              </div>
              <div className="flex gap-4 text-sm font-medium text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div>Volume: <span className="text-blue-900">{formatNumber(sopTableTotals.qty)} MT</span></div>
                {!isBroker && <div>Sales: <span className="text-blue-900">{formatCurrency(sopTableTotals.sales)}</span></div>}
                <div>GP: <span className="text-blue-900">{formatCurrency(sopTableTotals.gp)}</span></div>
              </div>
            </div>
          } className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-blue-50 text-blue-800 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4 border-b border-blue-100">
                      <div>Order Ref</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.orderRef}
                        onChange={(e) => setSopFilters({...sopFilters, orderRef: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => d.orderReference).filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      <div>Product</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.product}
                        onChange={(e) => setSopFilters({...sopFilters, product: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => d.product).filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      <div>Type</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.type}
                        onChange={(e) => setSopFilters({...sopFilters, type: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => d.recordType || 'Baseline').filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      <div>Supplier</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.supplier}
                        onChange={(e) => setSopFilters({...sopFilters, supplier: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => d.supplier).filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      <div>Period</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.period}
                        onChange={(e) => setSopFilters({...sopFilters, period: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`).filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100 text-right align-top">
                      Qty (MT)
                    </th>
                    <th className="p-4 border-b border-blue-100 text-right align-top">
                      Sales
                    </th>
                    <th className="p-4 border-b border-blue-100 text-right align-top">
                      GP
                    </th>
                    <th className="p-4 border-b border-blue-100 text-right align-top">
                      GP %
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      <div>Status</div>
                      <select
                        className="mt-1 w-full px-1 py-0.5 text-xs font-normal border rounded bg-white text-slate-700"
                        value={sopFilters.status}
                        onChange={(e) => setSopFilters({...sopFilters, status: e.target.value})}
                      >
                        <option value="">All</option>
                        {Array.from(new Set(unfilteredSopData.map(d => d.status).filter(Boolean))).sort().map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-4 border-b border-blue-100 text-center align-top">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {sopData.map((row) => {
                    const isEditing = editingId === row.id;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 font-mono text-xs text-blue-700">
                          {row.orderReference || "-"}
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          {row.product}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editRecordType}
                              onChange={(e) => setEditRecordType(e.target.value as any)}
                              className="w-24 px-1 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-xs"
                            >
                              <option value="Baseline">Baseline</option>
                              <option value="NPI">NPI</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              row.recordType === 'NPI' ? 'bg-purple-100 text-purple-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {row.recordType || 'Baseline'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <select
                              value={editSupplier}
                              onChange={(e) => setEditSupplier(e.target.value)}
                              className="w-32 px-1 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-xs"
                            >
                              <option value="">Select...</option>
                              {suppliers.map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            row.supplier || "-"
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <select
                                value={editMonth}
                                onChange={(e) =>
                                  setEditMonth(Number(e.target.value))
                                }
                                className="w-16 px-1 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-xs"
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                  (m) => (
                                    <option key={m} value={m}>
                                      {String(m).padStart(2, "0")}
                                    </option>
                                  ),
                                )}
                              </select>
                              <select
                                value={editYear}
                                onChange={(e) =>
                                  setEditYear(Number(e.target.value))
                                }
                                className="w-20 px-1 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-xs"
                              >
                                {availableYears.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            `${row.year}-${String(row.month).padStart(2, "0")}`
                          )}
                        </td>

                        {/* Qty Column */}
                        <td className="p-4 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-right"
                            />
                          ) : (
                            <span className="font-semibold">
                              {row.qty.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right text-slate-600">
                          {formatCurrency(row.sales)}
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {formatCurrency(row.gp)}
                        </td>
                        <td className="p-4 text-right text-slate-600">
                          {row.sales > 0
                            ? ((row.gp / row.sales) * 100).toFixed(1) + "%"
                            : "0.0%"}
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.workflowStatus === ForecastStatus.ARCHIVED
                                ? "bg-red-100 text-red-700"
                                : row.workflowStatus === ForecastStatus.APPROVED
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {row.workflowStatus}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="p-4 flex justify-center gap-2 relative">
                          {isEditing ? (
                            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-xl border border-slate-200 absolute right-12 z-20 -top-2">
                              <div className="flex flex-col">
                                <label className="text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                                  Reason Code
                                </label>
                                <select
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  className="text-xs p-1.5 border border-slate-300 rounded w-40 outline-none focus:border-blue-500"
                                >
                                  <option value="">Select Reason...</option>
                                  {REASONS.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                                {editError && (
                                  <span className="text-[10px] text-red-500 mt-1">
                                    {editError}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 mt-4">
                                <button
                                  onClick={handleSave}
                                  className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200"
                                  title="Save"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                                  title="Cancel"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            row.workflowStatus !== ForecastStatus.ARCHIVED && (
                              <>
                                <button
                                  onClick={() => startEdit(row)}
                                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                                  title="Amend Forecast"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {sopData.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-8 text-center text-slate-400 italic"
                      >
                        No S&OP records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </MaximizeWrapper>
        </div>

        {/* Budget Section */}
        <div className="space-y-4">
          <MaximizeWrapper title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-600">
                <BookOpen className="h-5 w-5" />
                <span>Budget Baseline</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  Reference Only
                </span>
              </div>
              <div className="flex gap-4 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                <div>Volume: <span className="text-slate-800">{formatNumber(kpiStats.baseline.qty)} MT</span></div>
                {!isBroker && <div>Sales: <span className="text-slate-800">{formatCurrency(kpiStats.baseline.sales)}</span></div>}
                <div>GP: <span className="text-slate-800">{formatCurrency(kpiStats.baseline.gp)}</span></div>
              </div>
            </div>
          } className="overflow-hidden opacity-90">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-4 border-b border-slate-200">Product</th>
                    <th className="p-4 border-b border-slate-200">Type</th>
                    <th className="p-4 border-b border-slate-200">Supplier</th>
                    <th className="p-4 border-b border-slate-200">Period</th>
                    <th className="p-4 border-b border-slate-200 text-right">
                      Qty (MT)
                    </th>
                    <th className="p-4 border-b border-slate-200 text-right">
                      Sales
                    </th>
                    <th className="p-4 border-b border-slate-200 text-right">
                      GP
                    </th>
                    <th className="p-4 border-b border-slate-200 text-right">
                      GP %
                    </th>
                    <th className="p-4 border-b border-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
                  {budgetData.map((row) => (
                    <tr key={row.id}>
                      <td className="p-4 font-medium">{row.product}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.recordType === 'NPI' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.recordType || 'Baseline'}
                        </span>
                      </td>
                      <td className="p-4">{row.supplier || "-"}</td>
                      <td className="p-4">
                        {row.year}-{String(row.month).padStart(2, "0")}
                      </td>
                      <td className="p-4 text-right font-mono">
                        {row.qty.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(row.sales)}
                      </td>
                      <td className="p-4 text-right">{formatCurrency(row.gp)}</td>
                      <td className="p-4 text-right">
                        {row.sales > 0
                          ? ((row.gp / row.sales) * 100).toFixed(1) + "%"
                          : "0.0%"}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {budgetData.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-8 text-center text-slate-400 italic"
                      >
                        No Budget records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </MaximizeWrapper>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;
