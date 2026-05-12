import React, { useState, useEffect, useMemo } from 'react';
import { User, ForecastRecord, AuditLog, Client, Product, Supplier, CRMActivity, CRMStage, CRMVisitPurpose, PurchaseOrder, POStatus, ForecastStatus, AppView, RoleDefinition, ActionItem } from './types';
import * as api from './services/api';
import { generateMockData } from './services/mockData';
import LoginScreen from './components/LoginScreen';
import SelectionScreen from './components/SelectionScreen';
import ReviewScreen from './components/ReviewScreen';
import ConfirmationScreen from './components/ConfirmationScreen';
import DashboardScreen from './components/DashboardScreen';
import ExecutiveDashboardScreen from './components/ExecutiveDashboardScreen';
import ClientManagementScreen from './components/ClientManagementScreen';
import SupplierManagementScreen from './components/SupplierManagementScreen';
import SupplierAnalysisScreen from './components/SupplierAnalysisScreen';
import POTrackingScreen from './components/POTrackingScreen';
import ProductManagementScreen from './components/ProductManagementScreen';
import MRPScreen from './components/MRPScreen';
import ForecasterScreen from './components/ForecasterScreen';
import CRMScreen from './components/CRMScreen';
import ActionItemsScreen from './components/ActionItemsScreen';
import ActionItemsDashboard from './components/ActionItemsDashboard';
import AuditDashboardScreen from './components/AuditDashboardScreen';
import GapAnalysisScreen from './components/GapAnalysisScreen';
import ScenarioPlanningScreen from './components/ScenarioPlanningScreen';
import NPIPromotionsScreen from './components/NPIPromotionsScreen';
import DetailedChartsScreen from './components/DetailedChartsScreen';
import SupplyReviewScreen from './components/SupplyReviewScreen';
import UserManagementScreen from './components/UserManagementScreen';
import { LayoutDashboard, BarChart3, PieChart, Users, Package, FileSpreadsheet, LogOut, Menu, Calculator, Truck, TrendingUp, Target, CheckSquare, ListTodo, ShoppingCart, ShieldAlert, Activity, Sliders, Tag, LineChart } from 'lucide-react';



const SectionHeader = ({ title, isOpen }: { title: string, isOpen: boolean }) => {
  if (!isOpen) return <div className="py-2 border-b border-slate-700 mx-4 mb-2 mt-4"></div>;
  return <div className="px-4 py-2 mt-4 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>;
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentCycle, setCurrentCycle] = useState<string>('S&OP1');
  
  // "Database" state
  const [data, setData] = useState<ForecastRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]); // All logs
  const [sessionLogs, setSessionLogs] = useState<AuditLog[]>([]); // Logs for current workflow

  // Master Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [crmActivities, setCrmActivities] = useState<CRMActivity[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  // Selection state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('');

  // Initialize Data with API or switch to Mock Data if no connection
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          fetchedData,
          fetchedAuditLogs,
          fetchedClients,
          fetchedSuppliers,
          fetchedProducts,
          fetchedPurchaseOrders,
          fetchedCrmActivities,
          fetchedActionItems,
          fetchedUsers
        ] = await Promise.all([
          api.getForecastRecords(),
          api.getAuditLogs(),
          api.getClients(),
          api.getSuppliers(),
          api.getProducts(),
          api.getPurchaseOrders(),
          api.getCrmActivities(),
          api.getActionItems(),
          api.getUsers(),
        ]);
        
        setData(fetchedData);
        setAuditLogs(fetchedAuditLogs);
        setClients(fetchedClients);
        setSuppliers(fetchedSuppliers);
        setProducts(fetchedProducts);
        setPurchaseOrders(fetchedPurchaseOrders);
        setCrmActivities(fetchedCrmActivities);
        setActionItems(fetchedActionItems);
        localStorage.setItem('actionItems', JSON.stringify(fetchedActionItems));
        
        if (fetchedUsers && fetchedUsers.length > 0) {
          setUsers(fetchedUsers);
        } else {
          // Keep the initial users if DB is empty
          api.createUser({ id: 'user-1', email: 'admin@company.com', name: 'Admin User', roleId: 'role-admin' }).catch(() => {});
        }
      } catch (err) {
        console.warn('Backend unavailable, using local mock data.');
        const savedActionItems = localStorage.getItem('actionItems');
        if (savedActionItems) {
          try { setActionItems(JSON.parse(savedActionItems)); } catch {}
        }
        const mockData = generateMockData();
        setData(mockData);
        
        // Extract unique clients from mock data and create client definitions
        const uniqueClientNames = Array.from(new Set(mockData.map(d => d.client)));
        const initialClients: Client[] = uniqueClientNames.map((name, index) => {
          const firstRecord = mockData.find(d => d.client === name);
          return {
            id: `client-${index}`,
            name,
            country: firstRecord?.country || 'USA',
            salesRepName: firstRecord?.salesPerson || 'John Doe',
            salesRepEmail: firstRecord?.salesPersonEmail || 'john.doe@company.com',
            subsidiary: firstRecord?.subsidiary || 'Global',
            section: firstRecord?.section || 'Trade'
          };
        });
        setClients(initialClients);
      }
    };

    loadData();

    // Load roles from database, fall back to defaults if unavailable
    const defaultRoles: RoleDefinition[] = [
      { id: 'role-admin', name: 'Admin', authorities: Object.values(AppView).filter(v => typeof v === 'number') as AppView[] },
      { id: 'role-sales', name: 'Sales', authorities: [AppView.DASHBOARD, AppView.FORECASTER, AppView.FORECAST_SELECTION, AppView.FORECAST_REVIEW, AppView.CRM, AppView.ACTION_ITEMS] },
      { id: 'role-manager', name: 'Manager', authorities: [AppView.DASHBOARD, AppView.FORECASTER, AppView.FORECAST_SELECTION, AppView.FORECAST_REVIEW, AppView.CRM, AppView.ACTION_ITEMS, AppView.AUDIT_DASHBOARD] },
      { id: 'role-board', name: 'Board', authorities: [AppView.EXECUTIVE_DASHBOARD, AppView.DETAILED_CHARTS] },
      { id: 'role-analyst', name: 'Data Analyst', authorities: [AppView.DASHBOARD, AppView.DETAILED_CHARTS, AppView.GAP_ANALYSIS, AppView.SCENARIO_PLANNING] },
    ];
    api.getRoles().then(dbRoles => {
      if (dbRoles && dbRoles.length > 0) setRoles(dbRoles as RoleDefinition[]);
      else setRoles(defaultRoles);
    }).catch(() => setRoles(defaultRoles));

    const initialUsers: User[] = [
      { id: 'user-1', email: 'admin@company.com', name: 'Admin User', roleId: 'role-admin' },
      { id: 'user-2', email: 'sales@company.com', name: 'Sales Rep', roleId: 'role-sales', subsidiary: 'Group A' },
      { id: 'user-3', email: 'manager@company.com', name: 'Sales Manager', roleId: 'role-manager', subsidiary: 'Group A' },
      { id: 'user-4', email: 'board@company.com', name: 'Board Member', roleId: 'role-board' },
      { id: 'user-5', email: 'analyst@company.com', name: 'Data Analyst', roleId: 'role-analyst' },
    ];
    setUsers(initialUsers);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(AppView.DASHBOARD);
  };

  const handleImportData = (importedData: ForecastRecord[]) => {
    setData(importedData);
    setAuditLogs([]);
    setSessionLogs([]);
  };

  const handleSelection = (client: string, section: string, subsidiary: string) => {
    setSelectedClient(client);
    setSelectedSection(section);
    setSelectedSubsidiary(subsidiary);
    setSessionLogs([]); 
    setView(AppView.FORECAST_REVIEW);
  };

  const handleDataUpdate = (updatedRecords: ForecastRecord[], newLogs: AuditLog[]) => {
    setData(prevData => {
      const updatedMap = new Map(updatedRecords.map(r => [r.id, r]));
      const newData = prevData.map(r => updatedMap.has(r.id) ? updatedMap.get(r.id)! : r);
      const existingIds = new Set(prevData.map(r => r.id));
      const newAdditions = updatedRecords.filter(r => !existingIds.has(r.id));
      return [...newData, ...newAdditions];
    });
    setAuditLogs(prev => [...prev, ...newLogs]);
    setSessionLogs(prev => [...prev, ...newLogs]);

    // Save to API (silently catch network errors)
    api.saveForecastBatch(updatedRecords).catch(() => {});
    if (newLogs.length > 0) {
      api.saveAuditLogBatch(newLogs).catch(() => {});
    }
  };

  const handleApproveLog = (log: AuditLog) => {
    setData(prevData => prevData.map(r => {
      if (r.id === log.recordId) {
        const updatedRecord = { ...r, workflowStatus: ForecastStatus.APPROVED };
        api.updateForecastRecord(r.id, updatedRecord).catch(() => {});
        return updatedRecord;
      }
      return r;
    }));
    
    // Update the log itself to indicate it was approved
    const approvalLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: user?.email || 'unknown',
      recordId: log.recordId,
      product: log.product,
      actionType: "AMEND",
      reasonCode: "Approved by Manager/Admin",
      details: `Change approved.`,
      client: log.client,
      subsidiary: log.subsidiary,
      salesRep: log.salesRep,
      month: log.month,
      year: log.year,
      previousQty: log.newQty,
      newQty: log.newQty,
      previousSales: log.newSales,
      newSales: log.newSales,
      previousGP: log.newGP,
      newGP: log.newGP,
    };
    setAuditLogs(prev => [...prev, approvalLog]);
    api.createAuditLog(approvalLog).catch(() => {});
  };

  const handleDeclineLog = (log: AuditLog) => {
    setData(prevData => {
      // If it was a new record (previousQty was 0 and it's an AMEND), we might want to delete it or revert it.
      // The prompt says "delete the change and revert to the existing state before editing if declined"
      if (log.actionType === 'AMEND' && log.previousQty === 0 && log.previousSales === 0 && log.previousGP === 0 && log.details.includes('Added new record')) {
        // It was a new record, so delete it
        api.deleteForecastRecord(log.recordId).catch(() => {});
        return prevData.filter(r => r.id !== log.recordId);
      }
      
      // Otherwise revert to previous state
      return prevData.map(r => {
        if (r.id === log.recordId) {
          const revertedRecord = {
            ...r,
            qty: log.previousQty,
            sales: log.previousSales,
            gp: log.previousGP,
            month: log.previousMonth || r.month,
            year: log.previousYear || r.year,
            workflowStatus: ForecastStatus.APPROVED // Revert to approved since it was approved before
          };
          api.updateForecastRecord(r.id, revertedRecord).catch(() => {});
          return revertedRecord;
        }
        return r;
      });
    });

    const declineLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userEmail: user?.email || 'unknown',
      recordId: log.recordId,
      product: log.product,
      actionType: "AMEND",
      reasonCode: "Declined by Manager/Admin",
      details: `Change declined and reverted.`,
      client: log.client,
      subsidiary: log.subsidiary,
      salesRep: log.salesRep,
      month: log.previousMonth || log.month,
      year: log.previousYear || log.year,
      previousQty: log.newQty,
      newQty: log.previousQty,
      previousSales: log.newSales,
      newSales: log.previousSales,
      previousGP: log.newGP,
      newGP: log.previousGP,
    };
    setAuditLogs(prev => [...prev, declineLog]);
    api.createAuditLog(declineLog).catch(() => {});
  };

  const handleSubmit = () => {
    setView(AppView.FORECAST_CONFIRMATION);
  };

  const handleReset = () => {
    setSelectedClient('');
    setSelectedSection('');
    setSessionLogs([]);
    setView(AppView.FORECAST_SELECTION);
  };

  const handleLogout = () => {
    setUser(null);
    setView(AppView.LOGIN);
  };

  // Client CRUD
  const handleAddClient = (client: Client) => {
    setClients([...clients, client]);
    api.createClient(client).catch(() => {});
  };
  const handleUpdateClient = (client: Client) => {
    setClients(clients.map(c => c.id === client.id ? client : c));
    api.updateClient(client.id, client).catch(() => {});
  };
  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    api.deleteClient(id).catch(() => {});
  };

  // Supplier CRUD
  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers([...suppliers, supplier]);
    api.createSupplier(supplier).catch(() => {});
  };
  const handleUpdateSupplier = (supplier: Supplier) => {
    setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
    api.updateSupplier(supplier.id, supplier).catch(() => {});
  };
  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
    api.deleteSupplier(id).catch(() => {});
  };

  // Product CRUD
  const handleAddProduct = (product: Product) => {
    setProducts([...products, product]);
    api.createProduct(product).catch(() => {});
  };
  const handleUpdateProduct = (product: Product) => {
    setProducts(products.map(p => p.id === product.id ? product : p));
    api.updateProduct(product.id, product).catch(() => {});
  };
  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    api.deleteProduct(id).catch(() => {});
  };

  // CRM CRUD
  const handleAddActivity = (activity: CRMActivity) => {
    setCrmActivities([...crmActivities, activity]);
    api.createCrmActivity(activity).catch(() => {});
  };
  const handleUpdateActivity = (activity: CRMActivity) => {
    setCrmActivities(crmActivities.map(a => a.id === activity.id ? activity : a));
    api.updateCrmActivity(activity.id, activity).catch(() => {});
  };

  const getUserRoleName = (u: User | null) => {
    if (!u) return '';
    const role = roles.find(r => r.id === u.roleId);
    return role ? role.name : '';
  };

  const hasAuthority = (targetView: AppView) => {
    if (!user) return false;
    const role = roles.find(r => r.id === user.roleId);
    if (!role) return false;
    return role.authorities.includes(targetView);
  };

  // Filter data based on user role
  const roleFilteredData = useMemo(() => {
    if (!user) return data;
    const roleName = getUserRoleName(user);
    if (roleName === 'Admin' || roleName === 'Board') return data;
    if (roleName === 'Manager' && user.subsidiary) {
      return data.filter(d => d.subsidiary === user.subsidiary);
    }
    if (roleName === 'Sales' && user.subsidiary) {
      return data.filter(d => d.subsidiary === user.subsidiary && d.salesPersonEmail === user.email);
    }
    return data;
  }, [data, user, roles]);

  // Filter data by current cycle (and always include Budget for baseline comparisons)
  const filteredData = useMemo(() => {
    return roleFilteredData.filter(d => d.version === currentCycle || d.version === 'Budget');
  }, [roleFilteredData, currentCycle]);

  const effectiveRoleFilteredData = useMemo(() => {
    return roleFilteredData.map(d => {
      if (d.status === 'Booked' && d.invoicingMonth && d.invoicingYear) {
        return { ...d, month: d.invoicingMonth, year: d.invoicingYear };
      }
      return d;
    });
  }, [roleFilteredData]);

  const cycleYear = useMemo(() => {
    const yearMatch = currentCycle.match(/\b(20\d{2})\b/);
    if (yearMatch) return parseInt(yearMatch[1]);
    
    // Fallback: find the most common year in this cycle's data, favoring latest
    const cycleRecords = data.filter(d => d.version === currentCycle);
    if (cycleRecords.length > 0) {
      let maxYear = new Date().getFullYear();
      let maxCount = 0;
      
      const yearCounts = cycleRecords.reduce((acc, rec) => {
        acc[rec.year] = (acc[rec.year] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const sortedYears = Object.keys(yearCounts).map(Number).sort((a, b) => b - a);
      for (const year of sortedYears) {
        if (yearCounts[year] > maxCount * 0.8) {
          maxCount = yearCounts[year];
          maxYear = year;
        }
      }
      return maxYear;
    }
    return new Date().getFullYear();
  }, [currentCycle, data]);

  const effectiveFilteredData = useMemo(() => {
    return effectiveRoleFilteredData.filter(d => 
      (d.version === currentCycle || d.version === 'Budget') && d.year === cycleYear
    );
  }, [effectiveRoleFilteredData, currentCycle, cycleYear]);

  const availableCycles = useMemo(() => {
    const cycles = new Set(data.map(d => d.version));
    cycles.delete('Budget');
    return Array.from(cycles).sort();
  }, [data]);

  useEffect(() => {
    if (availableCycles.length > 0 && !availableCycles.includes(currentCycle)) {
      setCurrentCycle(availableCycles[availableCycles.length - 1]);
    }
  }, [availableCycles, currentCycle]);

  const handleStartNewCycle = () => {
    if (!user || getUserRoleName(user) !== 'Admin') return;
    
    // Find current cycle number and year
    const match = currentCycle.match(/S&OP(\d+)(?:\s+(\d{4}))?/);
    const nextNumber = match ? parseInt(match[1], 10) + 1 : 1;
    const yearPart = match && match[2] ? ` ${match[2]}` : '';
    const nextCycle = `S&OP${nextNumber}${yearPart}`;

    // Get all records from current cycle
    let currentRecords = data.filter(d => d.version === currentCycle);
    
    // Fallback to Budget if current cycle has no records
    if (currentRecords.length === 0) {
      currentRecords = data.filter(d => d.version === 'Budget');
    }
    
    if (currentRecords.length === 0) return; // Nothing to duplicate
    
    // Duplicate and update them
    const newRecords = currentRecords.map(rec => ({
      ...rec,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: nextCycle,
      status: rec.status === 'Booked' ? 'Booked' : 'Draft' as any, // Preserve Booked, reset others to Draft
      workflowStatus: rec.status === 'Booked' ? ForecastStatus.APPROVED : ForecastStatus.DRAFT
    }));

    setData([...data, ...newRecords]);
    setCurrentCycle(nextCycle);
  };

  if (view === AppView.LOGIN) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onImportData={handleImportData}
        users={users}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl h-full z-50`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">SupplyChain<span className="text-blue-400">Pro</span></span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SectionHeader title="Overview" isOpen={isSidebarOpen} />
          
          {hasAuthority(AppView.DASHBOARD) && (
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              isOpen={isSidebarOpen} 
              active={view === AppView.DASHBOARD}
              onClick={() => setView(AppView.DASHBOARD)}
            />
          )}

          {hasAuthority(AppView.EXECUTIVE_DASHBOARD) && (
            <NavItem 
              icon={<BarChart3 size={20} />} 
              label="Exec Dashboard" 
              isOpen={isSidebarOpen} 
              active={view === AppView.EXECUTIVE_DASHBOARD}
              onClick={() => setView(AppView.EXECUTIVE_DASHBOARD)}
            />
          )}

          <SectionHeader title="Master Data & CRM" isOpen={isSidebarOpen} />

          {hasAuthority(AppView.CRM) && (
            <NavItem 
              icon={<Target size={20} />} 
              label="Mini CRM" 
              isOpen={isSidebarOpen} 
              active={view === AppView.CRM}
              onClick={() => setView(AppView.CRM)}
            />
          )}

          {hasAuthority(AppView.CLIENTS) && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Clients" 
              isOpen={isSidebarOpen} 
              active={view === AppView.CLIENTS}
              onClick={() => setView(AppView.CLIENTS)}
            />
          )}

          {hasAuthority(AppView.PRODUCTS) && (
            <NavItem 
              icon={<Package size={20} />} 
              label="Products" 
              isOpen={isSidebarOpen} 
              active={view === AppView.PRODUCTS}
              onClick={() => setView(AppView.PRODUCTS)}
            />
          )}

          {hasAuthority(AppView.SUPPLIERS) && (
            <NavItem 
              icon={<Truck size={20} />} 
              label="Suppliers" 
              isOpen={isSidebarOpen} 
              active={view === AppView.SUPPLIERS}
              onClick={() => setView(AppView.SUPPLIERS)}
            />
          )}

          <SectionHeader title="Sales & Forecasting" isOpen={isSidebarOpen} />

          {hasAuthority(AppView.FORECASTER) && (
            <NavItem 
              icon={<TrendingUp size={20} />} 
              label="Forecaster" 
              isOpen={isSidebarOpen} 
              active={view === AppView.FORECASTER}
              onClick={() => setView(AppView.FORECASTER)}
            />
          )}

          {hasAuthority(AppView.FORECAST_SELECTION) && (
            <NavItem 
              icon={<FileSpreadsheet size={20} />} 
              label="Forecasts" 
              isOpen={isSidebarOpen} 
              active={[AppView.FORECAST_SELECTION, AppView.FORECAST_REVIEW, AppView.FORECAST_CONFIRMATION].includes(view)}
              onClick={() => setView(AppView.FORECAST_SELECTION)}
            />
          )}

          {hasAuthority(AppView.NPI_PROMOTIONS) && (
            <NavItem 
              icon={<Tag size={20} />} 
              label="NPI & Promotions" 
              isOpen={isSidebarOpen} 
              active={view === AppView.NPI_PROMOTIONS}
              onClick={() => setView(AppView.NPI_PROMOTIONS)}
            />
          )}

          <SectionHeader title="Supply Chain & Purchasing" isOpen={isSidebarOpen} />

          {hasAuthority(AppView.SUPPLY_REVIEW) && (
            <NavItem 
              icon={<Truck size={20} />} 
              label="Supply Review" 
              isOpen={isSidebarOpen} 
              active={view === AppView.SUPPLY_REVIEW}
              onClick={() => setView(AppView.SUPPLY_REVIEW)}
            />
          )}

          {hasAuthority(AppView.MRP) && (
            <NavItem 
              icon={<Calculator size={20} />} 
              label="MRP Run" 
              isOpen={isSidebarOpen} 
              active={view === AppView.MRP}
              onClick={() => setView(AppView.MRP)}
            />
          )}

          {hasAuthority(AppView.PO_TRACKING) && (
            <NavItem 
              icon={<ShoppingCart size={20} />} 
              label="PO Tracking" 
              isOpen={isSidebarOpen} 
              active={view === AppView.PO_TRACKING}
              onClick={() => setView(AppView.PO_TRACKING)}
            />
          )}

          {hasAuthority(AppView.SUPPLIER_ANALYSIS) && (
            <NavItem 
              icon={<Truck size={20} />} 
              label="Supplier Analysis" 
              isOpen={isSidebarOpen} 
              active={view === AppView.SUPPLIER_ANALYSIS}
              onClick={() => setView(AppView.SUPPLIER_ANALYSIS)}
            />
          )}

          <SectionHeader title="Analytics & Management" isOpen={isSidebarOpen} />

          {hasAuthority(AppView.USER_MANAGEMENT) && (
            <NavItem 
              icon={<Users size={20} />} 
              label="User Management" 
              isOpen={isSidebarOpen} 
              active={view === AppView.USER_MANAGEMENT}
              onClick={() => setView(AppView.USER_MANAGEMENT)}
            />
          )}

          {hasAuthority(AppView.DETAILED_CHARTS) && (
            <NavItem 
              icon={<LineChart size={20} />} 
              label="Detailed Charts" 
              isOpen={isSidebarOpen} 
              active={view === AppView.DETAILED_CHARTS}
              onClick={() => setView(AppView.DETAILED_CHARTS)}
            />
          )}

          {hasAuthority(AppView.GAP_ANALYSIS) && (
            <NavItem 
              icon={<Activity size={20} />} 
              label="Gap Analysis" 
              isOpen={isSidebarOpen} 
              active={view === AppView.GAP_ANALYSIS}
              onClick={() => setView(AppView.GAP_ANALYSIS)}
            />
          )}

          {hasAuthority(AppView.SCENARIO_PLANNING) && (
            <NavItem 
              icon={<Sliders size={20} />} 
              label="Sensitivity Analysis" 
              isOpen={isSidebarOpen} 
              active={view === AppView.SCENARIO_PLANNING}
              onClick={() => setView(AppView.SCENARIO_PLANNING)}
            />
          )}

          {hasAuthority(AppView.ACTION_ITEMS) && (
            <NavItem 
              icon={<CheckSquare size={20} />} 
              label="Action Items" 
              isOpen={isSidebarOpen} 
              active={view === AppView.ACTION_ITEMS}
              onClick={() => setView(AppView.ACTION_ITEMS)}
            />
          )}

          {hasAuthority(AppView.AUDIT_DASHBOARD) && (
            <NavItem 
              icon={<ShieldAlert size={20} />} 
              label="Audit Trail" 
              isOpen={isSidebarOpen} 
              active={view === AppView.AUDIT_DASHBOARD}
              onClick={() => setView(AppView.AUDIT_DASHBOARD)}
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">
              {AppView[view].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Current Cycle:</span>
              <select 
                value={currentCycle}
                onChange={(e) => setCurrentCycle(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-blue-600 focus:ring-0 cursor-pointer"
              >
                {availableCycles.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {getUserRoleName(user) === 'Admin' && (
              <button 
                onClick={handleStartNewCycle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Start New Cycle
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {view === AppView.DASHBOARD && (
          <DashboardScreen 
            data={effectiveRoleFilteredData} 
            clients={clients}
            products={products} 
            currentCycle={currentCycle}
          />
        )}

        {view === AppView.EXECUTIVE_DASHBOARD && (getUserRoleName(user) === 'Admin' || getUserRoleName(user) === 'Board' || getUserRoleName(user) === 'Manager' || getUserRoleName(user) === 'Data Analyst') && (
          <ExecutiveDashboardScreen data={effectiveFilteredData} />
        )}

        {view === AppView.SUPPLIER_ANALYSIS && (
          <SupplierAnalysisScreen 
            data={effectiveFilteredData} 
            products={products} 
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
          />
        )}
        
        {view === AppView.PO_TRACKING && (
          <POTrackingScreen 
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            products={products}
            userRole={getUserRoleName(user)}
            onAddPO={(po) => {
              setPurchaseOrders([...purchaseOrders, po]);
              api.createPurchaseOrder(po).catch(() => {});
            }}
            onUpdatePO={(po) => {
              setPurchaseOrders(purchaseOrders.map(p => p.id === po.id ? po : p));
              api.updatePurchaseOrder(po.id, po).catch(() => {});
            }}
            onDeletePO={(id) => {
              setPurchaseOrders(purchaseOrders.filter(p => p.id !== id));
              api.deletePurchaseOrder(id).catch(() => {});
            }}
          />
        )}

        {view === AppView.CLIENTS && (
          <ClientManagementScreen 
            clients={clients} 
            onAddClient={handleAddClient} 
            onUpdateClient={handleUpdateClient} 
            onDeleteClient={handleDeleteClient} 
            userRole={getUserRoleName(user)}
          />
        )}

        {view === AppView.SUPPLIERS && (
          <SupplierManagementScreen 
            suppliers={suppliers} 
            purchaseOrders={purchaseOrders}
            onAddSupplier={handleAddSupplier} 
            onUpdateSupplier={handleUpdateSupplier} 
            onDeleteSupplier={handleDeleteSupplier} 
            userRole={getUserRoleName(user)}
          />
        )}

        {view === AppView.PRODUCTS && (
          <ProductManagementScreen 
            products={products} 
            userRole={getUserRoleName(user)}
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct} 
          />
        )}

        {view === AppView.MRP && (
          <MRPScreen 
            data={effectiveFilteredData} 
            products={products} 
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            userRole={getUserRoleName(user)}
          />
        )}

        {view === AppView.FORECASTER && getUserRoleName(user) === 'Admin' && (
          <ForecasterScreen 
            data={filteredData} 
            clients={clients}
            products={products}
          />
        )}

        {view === AppView.CRM && (
          <CRMScreen 
            clients={clients}
            activities={crmActivities}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            user={user}
          />
        )}

        {view === AppView.ACTION_ITEMS && (
          <ActionItemsScreen 
            user={user} 
            userRole={getUserRoleName(user)}
            actionItems={actionItems}
            onAddActionItem={(item) => {
              setActionItems(prev => [...prev, item]);
              api.createActionItem(item).then(saved => {
                setActionItems(prev => prev.map(a => a.id === item.id ? saved : a));
              }).catch(() => {});
            }}
            onUpdateActionItem={(item) => {
              setActionItems(prev => prev.map(a => a.id === item.id ? item : a));
              api.updateActionItem(item.id, item).catch(() => {});
            }}
            onDeleteActionItem={(id) => {
              setActionItems(prev => prev.filter(a => a.id !== id));
              api.deleteActionItem(id).catch(() => {});
            }}
          />
        )}

        {view === AppView.FORECAST_SELECTION && (
          <SelectionScreen 
            data={filteredData} 
            clients={clients}
            userEmail={user?.email || ''} 
            userRole={getUserRoleName(user) as any || 'Sales'}
            userSubsidiary={user?.subsidiary}
            currentCycle={currentCycle}
            onProceed={handleSelection} 
          />
        )}

        {view === AppView.FORECAST_REVIEW && (
          <ReviewScreen
            data={effectiveFilteredData}
            products={products}
            suppliers={suppliers}
            client={selectedClient}
            section={selectedSection}
            subsidiary={selectedSubsidiary}
            currentUserEmail={user?.email || 'unknown'}
            currentUserName={user?.name || 'Unknown'}
            currentCycle={currentCycle}
            onUpdateData={handleDataUpdate}
            onBack={() => setView(AppView.FORECAST_SELECTION)}
            onSubmit={handleSubmit}
          />
        )}

        {view === AppView.SUPPLY_REVIEW && (
          <SupplyReviewScreen
            data={data}
            products={products}
            onUpdateData={handleDataUpdate}
            currentUserEmail={user?.email || 'unknown'}
          />
        )}

        {view === AppView.FORECAST_CONFIRMATION && (
          <ConfirmationScreen 
            auditLogs={sessionLogs}
            onReset={handleReset}
          />
        )}

        {view === AppView.AUDIT_DASHBOARD && (getUserRoleName(user) === 'Admin' || getUserRoleName(user) === 'Board' || getUserRoleName(user) === 'Manager' || getUserRoleName(user) === 'Data Analyst') && (
          <AuditDashboardScreen 
            auditLogs={auditLogs}
            user={user}
            userRole={getUserRoleName(user)}
            data={data}
            onApprove={handleApproveLog}
            onDecline={handleDeclineLog}
          />
        )}

        {view === AppView.GAP_ANALYSIS && (getUserRoleName(user) === 'Admin' || getUserRoleName(user) === 'Board' || getUserRoleName(user) === 'Manager') && (
          <GapAnalysisScreen data={effectiveRoleFilteredData} availableCycles={availableCycles} currentCycle={currentCycle} />
        )}

        {view === AppView.DETAILED_CHARTS && (getUserRoleName(user) === 'Admin' || getUserRoleName(user) === 'Board' || getUserRoleName(user) === 'Manager') && (
          <DetailedChartsScreen data={effectiveRoleFilteredData} currentCycle={currentCycle} />
        )}

        {view === AppView.SCENARIO_PLANNING && getUserRoleName(user) === 'Admin' && (
          <ScenarioPlanningScreen data={effectiveRoleFilteredData} availableCycles={availableCycles} currentCycle={currentCycle} />
        )}

        {view === AppView.NPI_PROMOTIONS && (
          <NPIPromotionsScreen data={effectiveFilteredData} />
        )}

        {view === AppView.USER_MANAGEMENT && getUserRoleName(user) === 'Admin' && (
          <UserManagementScreen 
            users={users}
            roles={roles}
            onAddUser={(u) => {
              setUsers([...users, u]);
              api.createUser(u).catch(() => {});
            }}
            onUpdateUser={(u) => {
              setUsers(users.map(user => user.id === u.id ? u : user));
              api.updateUser(u.id, u).catch(() => {});
            }}
            onDeleteUser={(id) => {
              setUsers(users.filter(u => u.id !== id));
              api.deleteUser(id).catch(() => {});
            }}
            onAddRole={(r) => {
              setRoles(prev => [...prev, r]);
              api.createRole(r).catch(() => {});
            }}
            onUpdateRole={(r) => {
              setRoles(prev => prev.map(role => role.id === r.id ? r : role));
              api.updateRole(r.id, r).catch(() => {});
            }}
            onDeleteRole={(id) => {
              setRoles(prev => prev.filter(r => r.id !== id));
              api.deleteRole(id).catch(() => {});
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, isOpen, active, onClick }: { icon: React.ReactNode, label: string, isOpen: boolean, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${!isOpen && 'justify-center'}`}
  >
    {icon}
    {isOpen && <span className="font-medium">{label}</span>}
  </button>
);

export default App;
