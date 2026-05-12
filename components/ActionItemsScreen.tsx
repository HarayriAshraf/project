import React, { useState, useEffect } from 'react';
import { ActionItem, ActionItemUpdate, User } from '../types';
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ActionItemsDashboard from './ActionItemsDashboard';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  user: User | null;
  userRole: string;
  actionItems: ActionItem[];
  onAddActionItem: (item: ActionItem) => void;
  onUpdateActionItem: (item: ActionItem) => void;
  onDeleteActionItem: (id: number) => void;
}

const ActionItemsScreen: React.FC<Props> = ({ user, userRole, actionItems, onAddActionItem, onUpdateActionItem, onDeleteActionItem }) => {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DETAILS'>('DASHBOARD');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const [formData, setFormData] = useState<Partial<ActionItem>>({
    status: 'Open',
    date_opened: new Date().toISOString().split('T')[0],
    meeting_topic: 'General'
  });

  const [updateFormData, setUpdateFormData] = useState<Partial<ActionItemUpdate>>({
    date: new Date().toISOString().split('T')[0],
    status: 'In Progress',
    notes: ''
  });

  useEffect(() => {
    setItems(actionItems);
  }, [actionItems]);

  const handleSaveUpdate = async () => {
    if (!editingItem || !updateFormData.status) return;

    const newUpdate: ActionItemUpdate = {
      id: `update-${Date.now()}`,
      date: updateFormData.date || new Date().toISOString().split('T')[0],
      status: updateFormData.status as 'Open' | 'In Progress' | 'Closed' | 'Changed' | 'Cancelled',
      notes: updateFormData.notes || '',
      timestamp: new Date().toLocaleString()
    };

    const updatedItem = {
      ...editingItem,
      ...formData, // apply any changes made to the main form
      status: newUpdate.status,
      notes: newUpdate.notes,
      updates: [...(editingItem.updates || []), newUpdate]
    };

    try {
      onUpdateActionItem(updatedItem as ActionItem);
      setEditingItem(updatedItem as ActionItem);
      setFormData(updatedItem);
      setIsAddingUpdate(false);
      setUpdateFormData({
        date: new Date().toISOString().split('T')[0],
        status: updatedItem.status,
        notes: ''
      });
    } catch (error) {
      console.error('Failed to save update', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        onUpdateActionItem(formData as ActionItem);
        setIsAdding(false);
        setEditingItem(null);
      } else {
        const newItemData = {
          ...formData,
          id: Date.now(),
          subsidiary: formData.subsidiary || user?.subsidiary || ''
        };
        onAddActionItem(newItemData as ActionItem);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to save action item', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;
    try {
      onDeleteActionItem(id);
    } catch (error) {
      console.error('Failed to delete action item', error);
    }
  };

  const openEdit = (item: ActionItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsAddingUpdate(false);
    setUpdateFormData({
      date: new Date().toISOString().split('T')[0],
      status: item.status,
      notes: ''
    });
    setIsAdding(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({
      status: 'Open',
      date_opened: new Date().toISOString().split('T')[0],
      meeting_topic: 'General',
      assignee_email: user?.email || '',
      assignee_name: user?.name || '',
      subsidiary: user?.subsidiary || ''
    });
    setIsAddingUpdate(false);
    setIsAdding(true);
  };

  const uniqueCompanies = Array.from(new Set(items.map(i => i.company)));
  const uniqueStatuses = ['Open', 'In Progress', 'Closed', 'Changed', 'Cancelled'];

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterCompany('');
  };

  const filteredItems = items.filter(item => {
    // Role-based filtering
    if (userRole === 'Sales' && item.assignee_email !== user?.email) return false;
    if (userRole === 'Manager' && user?.subsidiary && item.subsidiary !== user.subsidiary) return false;

    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.assignee_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    const matchCompany = filterCompany ? item.company === filterCompany : true;
    return matchSearch && matchStatus && matchCompany;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toastMessage && (
        <div className={`fixed top-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 ${toastMessage.includes('Please fill') ? 'bg-red-500' : 'bg-emerald-500'}`}>
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Action Items</h1>
          <p className="text-slate-500">Manage and track tasks and action items</p>
        </div>
        {userRole === 'Admin' && (
          <button 
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Action Item
          </button>
        )}
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'DASHBOARD' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Action Items Dashboard
        </button>
        <button
          onClick={() => setActiveTab('DETAILS')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'DETAILS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Action Items Details
        </button>
      </div>

      {activeTab === 'DASHBOARD' ? (
        <ActionItemsDashboard items={filteredItems} />
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search title or assignee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select 
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(c => (
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

      <MaximizeWrapper title="Action Items Details" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4">Title & Topic</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Company & Cycle</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No action items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.meeting_topic}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{item.assignee_name}</div>
                      <div className="text-xs text-slate-500">{item.assignee_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700">{item.company}</div>
                      <div className="text-xs text-slate-500">{item.sop_cycle}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-600 mb-1">
                        <Clock size={14} /> Opened: {item.date_opened}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <AlertCircle size={14} className={new Date(item.due_date) < new Date() && item.status !== 'Closed' ? 'text-red-500' : ''} /> 
                        Due: <span className={new Date(item.due_date) < new Date() && item.status !== 'Closed' ? 'text-red-500 font-medium' : ''}>{item.due_date}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                        ${item.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 
                          item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                          item.status === 'Cancelled' ? 'bg-slate-100 text-slate-700' :
                          item.status === 'Changed' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate" title={item.notes}>
                      {item.notes}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      {userRole === 'Admin' && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </MaximizeWrapper>
      </>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingItem ? 'Edit Action Item' : 'Create Action Item'}
              </h2>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input 
                    type="text"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee Name *</label>
                  <input 
                    type="text"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.assignee_name || ''}
                    onChange={e => setFormData({...formData, assignee_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee Email *</label>
                  <input 
                    type="email"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.assignee_email || ''}
                    onChange={e => setFormData({...formData, assignee_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                  <input 
                    type="text"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.company || ''}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SOP Cycle *</label>
                  <input 
                    type="text"
                    required
                    disabled={userRole !== 'Admin'}
                    placeholder="e.g. Q1 2026"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.sop_cycle || ''}
                    onChange={e => setFormData({...formData, sop_cycle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Topic</label>
                  <input 
                    type="text"
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.meeting_topic || ''}
                    onChange={e => setFormData({...formData, meeting_topic: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                  <select 
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.status || 'Open'}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    {uniqueStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date Opened *</label>
                  <input 
                    type="date"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.date_opened || ''}
                    onChange={e => setFormData({...formData, date_opened: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                  <input 
                    type="date"
                    required
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.due_date || ''}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                {formData.status === 'Closed' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date Closed</label>
                    <input 
                      type="date"
                      disabled={userRole !== 'Admin'}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                      value={formData.date_closed || ''}
                      onChange={e => setFormData({...formData, date_closed: e.target.value})}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea 
                    disabled={userRole !== 'Admin'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 h-24 disabled:bg-slate-100 disabled:text-slate-500"
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              {editingItem && (
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
                          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                          <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={updateFormData.status || ''}
                            onChange={e => setUpdateFormData({...updateFormData, status: e.target.value as any})}
                          >
                            {uniqueStatuses.map(s => (
                              <option key={s} value={s}>{s}</option>
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
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => setIsAddingUpdate(false)}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveUpdate}
                          disabled={!updateFormData.status}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save Update
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {editingItem.updates && editingItem.updates.length > 0 ? (
                      [...editingItem.updates].reverse().map(update => (
                        <div key={update.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium
                                ${update.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 
                                  update.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                                  update.status === 'Cancelled' ? 'bg-slate-100 text-slate-700' :
                                  update.status === 'Changed' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'}`}>
                                {update.status}
                              </span>
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
                {userRole === 'Admin' ? 'Cancel' : 'Close'}
              </button>
              {userRole === 'Admin' && (
                <button 
                  onClick={() => {
                    if (!formData.title || !formData.assignee_name || !formData.assignee_email || !formData.company || !formData.sop_cycle || !formData.due_date) {
                      setToastMessage('Please fill all required (*) fields.');
                      setTimeout(() => setToastMessage(''), 3000);
                      return;
                    }
                    handleSave();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Action Item
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionItemsScreen;
