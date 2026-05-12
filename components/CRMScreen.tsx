import React, { useState, useMemo } from 'react';
import { Client, CRMActivity, CRMStage, CRMVisitPurpose, CRMUpdate, User } from '../types';
import { Plus, Search, Filter, Calendar, MapPin, User as UserIcon, Banknote, Target, Activity, PieChart, Download, Clock } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface CRMScreenProps {
  clients: Client[];
  activities: CRMActivity[];
  onAddActivity: (activity: CRMActivity) => void;
  onUpdateActivity: (activity: CRMActivity) => void;
  user: User | null;
}

const CLIENT_SECTORS = [
  'Detergents & Personal Care',
  'Nuts, Coffee, Tea & Staples',
  'Confectionery & Snacks',
  'Sauces & Condiments',
  'Food Powders',
  'Beverages',
  'Paints & Coatings',
  'Oil Refineries',
  'Pharmaceuticals',
  'Mining',
  'Animal Farms',
  'Carton & Board Manufacturing',
  'Trading',
  'Converters',
  'Food Processing',
  'Fertilizers and Pesticides'
];

const CRMScreen: React.FC<CRMScreenProps> = ({ clients, activities, onAddActivity, onUpdateActivity, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CRMActivity | null>(null);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'QUOTATIONS'>('PIPELINE');

  // Form State
  const [formData, setFormData] = useState<Partial<CRMActivity>>({
    stage: CRMStage.CONTACTED,
    purpose: CRMVisitPurpose.POTENTIAL_CLIENT,
    date: new Date().toISOString().split('T')[0],
    potentialValue: 0,
    leadSource: 'Referral from client'
  });

  const [updateFormData, setUpdateFormData] = useState<Partial<CRMUpdate>>({
    date: new Date().toISOString().split('T')[0],
    stage: CRMStage.CONTACTED,
    purpose: CRMVisitPurpose.FOLLOW_UP,
    notes: '',
    material: '',
    clientPrice: undefined,
    supplierPrice: undefined,
    clientPaymentTerm: '',
    supplierPaymentTerm: '',
    supplierName: ''
  });

  const leadSourceOptions = [
    "Travel",
    "EXPO's",
    "Referral from client",
    "Referral from intercompany",
    "Lead generation",
    "Old client revival"
  ];

  const uniqueReps = Array.from(new Set(activities.map(a => a.salesRepName)));
  const uniqueCountries = Array.from(new Set(activities.map(a => a.country)));

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRep('');
    setFilterCountry('');
  };

  const filteredActivities = activities.filter(a => {
    // Role-based filtering
    if (user?.role === 'Sales' && a.salesRepEmail !== user.email) return false;
    if (user?.role === 'Manager' && user.subsidiary && a.subsidiary !== user.subsidiary) return false;

    const matchesSearch = 
      a.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.find(c => c.id === a.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRep = filterRep ? a.salesRepName === filterRep : true;
    const matchesCountry = filterCountry ? a.country === filterCountry : true;
    return matchesSearch && matchesRep && matchesCountry;
  });

  // Dashboard Stats
  const totalPotential = filteredActivities
    .filter(a => a.stage !== CRMStage.CLOSED && a.stage !== CRMStage.REJECTED)
    .reduce((sum, a) => sum + (a.potentialValue || 0), 0);
  
  const closedDeals = filteredActivities
    .filter(a => a.stage === CRMStage.CLOSED)
    .reduce((sum, a) => sum + (a.potentialValue || 0), 0);

  const activeLeads = filteredActivities.filter(a => a.stage !== CRMStage.CLOSED && a.stage !== CRMStage.REJECTED).length;

  const stageDistribution = Object.values(CRMStage).reduce((acc, stage) => {
    acc[stage] = filteredActivities.filter(a => a.stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  const totalPipelineCount = Object.values(stageDistribution).reduce((sum, count) => sum + count, 0);

  const handleSave = () => {
    if (!formData.clientName && !formData.clientId) return;
    
    const activity: CRMActivity = {
      id: editingActivity ? editingActivity.id : `crm-${Date.now()}`,
      clientId: formData.clientId || '',
      clientName: formData.clientName || '',
      contactPerson: formData.contactPerson || '',
      contactInfo: formData.contactInfo || '',
      contactPersonEmail: formData.contactPersonEmail || '',
      contactPersonPhone: formData.contactPersonPhone || '',
      salesRepName: formData.salesRepName || user?.name || 'Current User',
      salesRepEmail: formData.salesRepEmail || user?.email || '',
      subsidiary: formData.subsidiary || user?.subsidiary || '',
      clientSector: formData.clientSector || '',
      country: formData.country || '',
      date: formData.date || new Date().toISOString().split('T')[0],
      timestamp: editingActivity?.timestamp || new Date().toLocaleString(),
      stage: formData.stage as CRMStage,
      purpose: formData.purpose as CRMVisitPurpose,
      notes: formData.notes || '',
      leadSource: formData.leadSource || 'Unknown',
      potentialValue: Number(formData.potentialValue) || 0,
      material: formData.material || '',
      clientPrice: Number(formData.clientPrice) || undefined,
      supplierPrice: Number(formData.supplierPrice) || undefined,
      clientPaymentTerm: formData.clientPaymentTerm || '',
      supplierPaymentTerm: formData.supplierPaymentTerm || '',
      supplierName: formData.supplierName || '',
      updates: editingActivity?.updates || []
    };

    if (editingActivity) {
      onUpdateActivity(activity);
    } else {
      onAddActivity(activity);
    }

    setIsAdding(false);
    setEditingActivity(null);
    setFormData({
      stage: CRMStage.CONTACTED,
      purpose: CRMVisitPurpose.POTENTIAL_CLIENT,
      date: new Date().toISOString().split('T')[0],
      potentialValue: 0,
      leadSource: 'Referral from client',
      material: '',
      clientPrice: undefined,
      supplierPrice: undefined,
      clientPaymentTerm: '',
      supplierPaymentTerm: '',
      supplierName: '',
      contactPersonEmail: '',
      contactPersonPhone: ''
    });
  };

  const handleSaveUpdate = () => {
    if (!editingActivity || !updateFormData.stage || !updateFormData.purpose) return;
    
    const newUpdate: CRMUpdate = {
      id: `upd-${Date.now()}`,
      date: updateFormData.date || new Date().toISOString().split('T')[0],
      stage: updateFormData.stage as CRMStage,
      purpose: updateFormData.purpose as CRMVisitPurpose,
      notes: updateFormData.notes || '',
      timestamp: new Date().toLocaleString(),
      material: updateFormData.material,
      clientPrice: updateFormData.clientPrice,
      supplierPrice: updateFormData.supplierPrice,
      clientPaymentTerm: updateFormData.clientPaymentTerm,
      supplierPaymentTerm: updateFormData.supplierPaymentTerm,
      supplierName: updateFormData.supplierName
    };

    const updatedActivity: CRMActivity = {
      ...editingActivity,
      ...formData, // apply any changes made to the main form
      date: newUpdate.date,
      stage: newUpdate.stage,
      purpose: newUpdate.purpose,
      notes: newUpdate.notes,
      // If the update has quotation details, update the main activity as well
      ...(newUpdate.stage === CRMStage.QUOTATION_SENT ? {
        material: newUpdate.material || editingActivity.material,
        clientPrice: newUpdate.clientPrice || editingActivity.clientPrice,
        supplierPrice: newUpdate.supplierPrice || editingActivity.supplierPrice,
        clientPaymentTerm: newUpdate.clientPaymentTerm || editingActivity.clientPaymentTerm,
        supplierPaymentTerm: newUpdate.supplierPaymentTerm || editingActivity.supplierPaymentTerm,
        supplierName: newUpdate.supplierName || editingActivity.supplierName
      } : {}),
      updates: [...(editingActivity.updates || []), newUpdate]
    };

    onUpdateActivity(updatedActivity);
    setEditingActivity(updatedActivity);
    setFormData(updatedActivity);
    setIsAddingUpdate(false);
    setUpdateFormData({
      date: new Date().toISOString().split('T')[0],
      stage: updatedActivity.stage,
      purpose: CRMVisitPurpose.FOLLOW_UP,
      notes: '',
      material: '',
      clientPrice: undefined,
      supplierPrice: undefined,
      clientPaymentTerm: '',
      supplierPaymentTerm: '',
      supplierName: ''
    });
  };

  const openEdit = (activity: CRMActivity) => {
    setEditingActivity(activity);
    setFormData(activity);
    setIsAddingUpdate(false);
    setUpdateFormData({
      date: new Date().toISOString().split('T')[0],
      stage: activity.stage,
      purpose: CRMVisitPurpose.FOLLOW_UP,
      notes: ''
    });
    setIsAdding(true);
  };

  const quotationsList = useMemo(() => {
    const list: any[] = [];
    filteredActivities.forEach(activity => {
      let hasQuotationUpdate = false;
      if (activity.updates) {
        activity.updates.forEach(update => {
          if (update.stage === CRMStage.QUOTATION_SENT) {
            hasQuotationUpdate = true;
            list.push({
              id: update.id,
              date: update.date,
              clientName: activity.clientName || clients.find(c => c.id === activity.clientId)?.name || 'Unknown',
              salesRepName: activity.salesRepName || 'Unknown',
              country: activity.country || 'Unknown',
              supplierName: update.supplierName || activity.supplierName,
              material: update.material || activity.material,
              clientPrice: update.clientPrice || activity.clientPrice,
              supplierPrice: update.supplierPrice || activity.supplierPrice,
              clientPaymentTerm: update.clientPaymentTerm || activity.clientPaymentTerm,
              supplierPaymentTerm: update.supplierPaymentTerm || activity.supplierPaymentTerm,
              notes: update.notes,
              activityRef: activity
            });
          }
        });
      }
      
      if (!hasQuotationUpdate && activity.stage === CRMStage.QUOTATION_SENT) {
        list.push({
          id: activity.id,
          date: activity.date,
          clientName: activity.clientName || clients.find(c => c.id === activity.clientId)?.name || 'Unknown',
          salesRepName: activity.salesRepName || 'Unknown',
          country: activity.country || 'Unknown',
          supplierName: activity.supplierName,
          material: activity.material,
          clientPrice: activity.clientPrice,
          supplierPrice: activity.supplierPrice,
          clientPaymentTerm: activity.clientPaymentTerm,
          supplierPaymentTerm: activity.supplierPaymentTerm,
          notes: activity.notes,
          activityRef: activity
        });
      }
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredActivities, clients]);

  const downloadQuotationsReport = () => {
    const headers = "Date,Client,Sales Rep,Country,Supplier,Material,Client Price,Supplier Price,Client Payment Term,Supplier Payment Term,Notes";
    
    const rows = quotationsList.map(q => {
      return `"${q.date}","${q.clientName}","${q.salesRepName}","${q.country}","${q.supplierName || ''}","${q.material || ''}","${q.clientPrice || ''}","${q.supplierPrice || ''}","${q.clientPaymentTerm || ''}","${q.supplierPaymentTerm || ''}","${q.notes.replace(/"/g, '""')}"`;
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quotations_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mini CRM</h1>
          <p className="text-slate-500">Track sales activities, visits, and potentials</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingActivity(null); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Log Activity
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('PIPELINE')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'PIPELINE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pipeline & Activities
        </button>
        <button
          onClick={() => setActiveTab('QUOTATIONS')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'QUOTATIONS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Quotations Sent Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search notes or clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sales Reps</option>
            {uniqueReps.map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>
          <select 
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Countries</option>
            {uniqueCountries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button 
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {activeTab === 'PIPELINE' ? (
        <>
          {/* Dashboard KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Leads</p>
              <h3 className="text-2xl font-bold text-slate-900">{activeLeads}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pipeline Potential</p>
              <h3 className="text-2xl font-bold text-slate-900">JOD {totalPotential.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Banknote size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Closed Won</p>
              <h3 className="text-2xl font-bold text-slate-900">JOD {closedDeals.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Stage Pipeline & Activity List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Pipeline Summary */}
        <div className="lg:col-span-1 space-y-4">
          <MaximizeWrapper title="Pipeline by Stage">
            <div className="space-y-3">
              {Object.entries(stageDistribution).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {totalPipelineCount > 0 ? Math.round((count / totalPipelineCount) * 100) : 0}%
                    </span>
                    <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded-md min-w-[2rem] text-center">{count}</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between font-semibold text-slate-800">
                <span>Total</span>
                <span>{totalPipelineCount}</span>
              </div>
            </div>
          </MaximizeWrapper>
        </div>

        {/* Activity List */}
        <div className="lg:col-span-3">
          <MaximizeWrapper title="Activity List" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                    <th className="p-4">Date</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Rep & Country</th>
                    <th className="p-4">Stage & Purpose</th>
                    <th className="p-4">Potential</th>
                    <th className="p-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No activities found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map(activity => (
                      <tr key={activity.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(activity)}>
                        <td className="p-4 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            {activity.date}
                          </div>
                          {activity.timestamp && (
                            <div className="text-xs text-slate-400 mt-1">
                              Logged: {activity.timestamp}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          {activity.clientName || clients.find(c => c.id === activity.clientId)?.name || 'Unknown Client'}
                          {(activity.contactPerson || activity.contactPersonEmail || activity.contactPersonPhone || activity.contactInfo) && (
                            <div className="text-xs text-slate-500 font-normal mt-1">
                              {activity.contactPerson}
                              {activity.contactPersonEmail && ` - ${activity.contactPersonEmail}`}
                              {activity.contactPersonPhone && ` - ${activity.contactPersonPhone}`}
                              {activity.contactInfo && ` - ${activity.contactInfo}`}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 font-normal mt-1">Source: {activity.leadSource}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <UserIcon size={14} /> {activity.salesRepName}
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <MapPin size={12} /> {activity.country}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1
                            ${activity.stage === CRMStage.CLOSED ? 'bg-emerald-100 text-emerald-700' : 
                              activity.stage === CRMStage.REJECTED ? 'bg-red-100 text-red-700' : 
                              'bg-blue-100 text-blue-700'}`}>
                            {activity.stage}
                          </span>
                          <div className="text-xs text-slate-500">{activity.purpose}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-700">
                          JOD {activity.potentialValue.toLocaleString()}
                        </td>
                        <td className="p-4 text-slate-600 max-w-xs truncate" title={activity.notes}>
                          {activity.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </MaximizeWrapper>
        </div>
      </div>
      </>
      ) : (
        <MaximizeWrapper title="Quotations Sent" className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-end items-center bg-slate-50">
            <button 
              onClick={downloadQuotationsReport}
              className="flex items-center gap-2 text-sm bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 transition"
            >
              <Download size={16} />
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="p-4">Date</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Sales Rep</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Material</th>
                  <th className="p-4">Client Price</th>
                  <th className="p-4">Supplier Price</th>
                  <th className="p-4">Client Term</th>
                  <th className="p-4">Supplier Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {quotationsList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No quotations sent matching your criteria.
                    </td>
                  </tr>
                ) : (
                  quotationsList.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openEdit(q.activityRef)}>
                      <td className="p-4 whitespace-nowrap text-slate-600">{q.date}</td>
                      <td className="p-4 font-medium text-slate-900">{q.clientName}</td>
                      <td className="p-4 text-slate-700">{q.salesRepName}</td>
                      <td className="p-4 text-slate-700">{q.country}</td>
                      <td className="p-4 text-slate-700">{q.supplierName || '-'}</td>
                      <td className="p-4 text-slate-700">{q.material || '-'}</td>
                      <td className="p-4 text-slate-700">{q.clientPrice ? `JOD ${q.clientPrice}` : '-'}</td>
                      <td className="p-4 text-slate-700">{q.supplierPrice ? `JOD ${q.supplierPrice}` : '-'}</td>
                      <td className="p-4 text-slate-700">{q.clientPaymentTerm || '-'}</td>
                      <td className="p-4 text-slate-700">{q.supplierPaymentTerm || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MaximizeWrapper>
      )}

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingActivity ? 'Edit Activity' : 'Log New Activity'}
              </h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                  <input 
                    type="text"
                    placeholder="Enter client name manually"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.clientName || ''}
                    onChange={e => setFormData({...formData, clientName: e.target.value, clientId: 'manual'})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input 
                    type="text"
                    placeholder="Enter country"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.country || ''}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input 
                    type="text"
                    placeholder="Name of contact"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.contactPerson || ''}
                    onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                  <input 
                    type="email"
                    placeholder="Email address"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.contactPersonEmail || ''}
                    onChange={e => setFormData({...formData, contactPersonEmail: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input 
                    type="tel"
                    placeholder="Phone number"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.contactPersonPhone || ''}
                    onChange={e => setFormData({...formData, contactPersonPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client Sector</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.clientSector || ''}
                    onChange={e => setFormData({...formData, clientSector: e.target.value})}
                  >
                    <option value="">Select Sector</option>
                    {CLIENT_SECTORS.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.stage || ''}
                    onChange={e => setFormData({...formData, stage: e.target.value as CRMStage})}
                  >
                    {Object.values(CRMStage).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Visit Purpose</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.purpose || ''}
                    onChange={e => setFormData({...formData, purpose: e.target.value as CRMVisitPurpose})}
                  >
                    {Object.values(CRMVisitPurpose).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Potential Value (JOD)</label>
                  <input 
                    type="number"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.potentialValue || ''}
                    onChange={e => setFormData({...formData, potentialValue: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.leadSource || ''}
                    onChange={e => setFormData({...formData, leadSource: e.target.value})}
                  >
                    {leadSourceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                  <input 
                    type="text"
                    placeholder="e.g. Steel Coils"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.material || ''}
                    onChange={e => setFormData({...formData, material: e.target.value})}
                  />
                </div>
              </div>

              {formData.stage === CRMStage.QUOTATION_SENT && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4 mt-4">
                  <h4 className="font-semibold text-blue-800 text-sm">Quotation Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                      <input 
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        value={formData.supplierName || ''}
                        onChange={e => setFormData({...formData, supplierName: e.target.value})}
                      />
                    </div>
                    <div className="hidden"></div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client Price (JOD)</label>
                      <input 
                        type="number"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        value={formData.clientPrice || ''}
                        onChange={e => setFormData({...formData, clientPrice: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Price (JOD)</label>
                      <input 
                        type="number"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        value={formData.supplierPrice || ''}
                        onChange={e => setFormData({...formData, supplierPrice: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client Payment Term</label>
                      <input 
                        type="text"
                        placeholder="e.g. Net 30"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        value={formData.clientPaymentTerm || ''}
                        onChange={e => setFormData({...formData, clientPaymentTerm: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Payment Term</label>
                      <input 
                        type="text"
                        placeholder="e.g. Net 60"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        value={formData.supplierPaymentTerm || ''}
                        onChange={e => setFormData({...formData, supplierPaymentTerm: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Outcomes</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Details of the visit, next steps, etc."
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              {editingActivity && (
                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Updates History</h3>
                    {!isAddingUpdate && (
                      <button 
                        onClick={() => setIsAddingUpdate(true)}
                        className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition"
                      >
                        <Plus size={16} />
                        Add Update
                      </button>
                    )}
                  </div>

                  {isAddingUpdate && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                      <h4 className="font-medium text-slate-800">New Update Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                          <input 
                            type="date"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={updateFormData.date || ''}
                            onChange={e => setUpdateFormData({...updateFormData, date: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={updateFormData.stage || ''}
                            onChange={e => setUpdateFormData({...updateFormData, stage: e.target.value as CRMStage})}
                          >
                            {Object.values(CRMStage).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Visit Purpose</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={updateFormData.purpose || ''}
                            onChange={e => setUpdateFormData({...updateFormData, purpose: e.target.value as CRMVisitPurpose})}
                          >
                            {Object.values(CRMVisitPurpose).map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Outcomes</label>
                          <textarea 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 h-20"
                            placeholder="Details of the update..."
                            value={updateFormData.notes || ''}
                            onChange={e => setUpdateFormData({...updateFormData, notes: e.target.value})}
                          ></textarea>
                        </div>
                      </div>

                      {updateFormData.stage === CRMStage.QUOTATION_SENT && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="col-span-2">
                            <h4 className="font-semibold text-blue-800 text-sm mb-2">Quotation Details</h4>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                            <input 
                              type="text"
                              placeholder="e.g. Steel Coils"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.material || ''}
                              onChange={e => setUpdateFormData({...updateFormData, material: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                            <input 
                              type="text"
                              placeholder="Supplier"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.supplierName || ''}
                              onChange={e => setUpdateFormData({...updateFormData, supplierName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client Price (JOD)</label>
                            <input 
                              type="number"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.clientPrice || ''}
                              onChange={e => setUpdateFormData({...updateFormData, clientPrice: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Price (JOD)</label>
                            <input 
                              type="number"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.supplierPrice || ''}
                              onChange={e => setUpdateFormData({...updateFormData, supplierPrice: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Client Payment Term</label>
                            <input 
                              type="text"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.clientPaymentTerm || ''}
                              onChange={e => setUpdateFormData({...updateFormData, clientPaymentTerm: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Payment Term</label>
                            <input 
                              type="text"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              value={updateFormData.supplierPaymentTerm || ''}
                              onChange={e => setUpdateFormData({...updateFormData, supplierPaymentTerm: e.target.value})}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2 mt-4">
                        <button 
                          onClick={() => setIsAddingUpdate(false)}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveUpdate}
                          disabled={!updateFormData.stage || !updateFormData.purpose}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save Update
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {editingActivity.updates && editingActivity.updates.length > 0 ? (
                      [...editingActivity.updates].reverse().map(update => (
                        <div key={update.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                                ${update.stage === CRMStage.CLOSED ? 'bg-emerald-100 text-emerald-700' : 
                                  update.stage === CRMStage.REJECTED ? 'bg-red-100 text-red-700' : 
                                  'bg-blue-100 text-blue-700'}`}>
                                {update.stage}
                              </span>
                              <span className="text-sm font-medium text-slate-700">{update.purpose}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-slate-900">{update.date}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                                <Clock size={10} />
                                {update.timestamp}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{update.notes}</p>
                          {update.stage === CRMStage.QUOTATION_SENT && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                              <h5 className="font-semibold text-blue-800 mb-2">Quotation Details</h5>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {update.material && <div><span className="text-slate-500">Material:</span> <span className="font-medium text-slate-800">{update.material}</span></div>}
                                {update.supplierName && <div><span className="text-slate-500">Supplier:</span> <span className="font-medium text-slate-800">{update.supplierName}</span></div>}
                                {update.clientPrice !== undefined && <div><span className="text-slate-500">Client Price:</span> <span className="font-medium text-slate-800">JOD {update.clientPrice}</span></div>}
                                {update.supplierPrice !== undefined && <div><span className="text-slate-500">Supplier Price:</span> <span className="font-medium text-slate-800">JOD {update.supplierPrice}</span></div>}
                                {update.clientPaymentTerm && <div><span className="text-slate-500">Client Terms:</span> <span className="font-medium text-slate-800">{update.clientPaymentTerm}</span></div>}
                                {update.supplierPaymentTerm && <div><span className="text-slate-500">Supplier Terms:</span> <span className="font-medium text-slate-800">{update.supplierPaymentTerm}</span></div>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                        No updates recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!formData.clientName && !formData.clientId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMScreen;
