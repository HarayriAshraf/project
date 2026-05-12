import React from 'react';
import { ActionItem } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckSquare, AlertTriangle, ListTodo, Clock } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

interface ActionItemsDashboardProps {
  items: ActionItem[];
}

const ActionItemsDashboard: React.FC<ActionItemsDashboardProps> = ({ items }) => {
  const totalItems = items.length;
  const openItems = items.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
  const overdueItems = items.filter(i => new Date(i.due_date) < new Date() && i.status !== 'Closed' && i.status !== 'Cancelled').length;

  const statusData = items.reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: item.status, value: 1 });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const companyData = items.reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.company);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: item.company, count: 1 });
    }
    return acc;
  }, [] as { name: string, count: number }[]);

  const recentItems = [...items].sort((a, b) => new Date(b.date_opened).getTime() - new Date(a.date_opened).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <ListTodo size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Items</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalItems}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <CheckSquare size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Open / In Progress</p>
              <h3 className="text-2xl font-bold text-slate-900">{openItems}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Overdue Items</p>
              <h3 className="text-2xl font-bold text-slate-900">{overdueItems}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MaximizeWrapper title="Items by Status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>

        <MaximizeWrapper title="Items by Company">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MaximizeWrapper>
      </div>

      <MaximizeWrapper title="Recently Opened Items">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {recentItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent items.</div>
            ) : (
              recentItems.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {item.company} • Assigned to: {item.assignee_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1
                      ${item.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                        item.status === 'Cancelled' ? 'bg-slate-100 text-slate-700' :
                        item.status === 'Changed' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                    <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <Clock size={12} /> Opened: {item.date_opened}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </MaximizeWrapper>
    </div>
  );
};

export default ActionItemsDashboard;
