import React, { useState } from 'react';
import { Client } from '../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface Props {
  clients: Client[];
  userRole?: string;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

const ClientManagementScreen: React.FC<Props> = ({ clients, userRole, onAddClient, onUpdateClient, onDeleteClient }) => {
  const isReadOnly = userRole !== 'Admin';
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    country: '',
    salesRepName: '',
    salesRepEmail: '',
    subsidiary: '',
    section: 'Trade'
  });

  const handleEditClick = (client: Client) => {
    setIsEditing(client.id);
    setEditForm(client);
  };

  const handleSaveEdit = () => {
    if (isEditing && editForm.name && editForm.country && editForm.salesRepName && editForm.salesRepEmail) {
      onUpdateClient(editForm as Client);
      setIsEditing(null);
      setEditForm({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setNewClient({
      name: '',
      country: '',
      salesRepName: '',
      salesRepEmail: '',
      subsidiary: '',
      section: 'Trade'
    });
  };

  const handleSaveAdd = () => {
    if (newClient.name && newClient.country && newClient.salesRepName && newClient.salesRepEmail) {
      const newId = `client-${Date.now()}`;
      onAddClient({ ...newClient, id: newId } as Client);
      setIsAdding(false);
      setNewClient({});
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewClient({});
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Client Management</h2>
        {!isReadOnly && (
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Client
          </button>
        )}
      </div>

      <MaximizeWrapper title="Client Management" className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Client Name</th>
              <th className="p-4 font-semibold text-slate-600">Country</th>
              <th className="p-4 font-semibold text-slate-600">Subsidiary</th>
              <th className="p-4 font-semibold text-slate-600">Section</th>
              <th className="p-4 font-semibold text-slate-600">Sales Rep Name</th>
              <th className="p-4 font-semibold text-slate-600">Sales Rep Email</th>
              {!isReadOnly && <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isAdding && !isReadOnly && (
              <tr className="bg-blue-50">
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Client Name"
                    className="w-full p-2 border rounded"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Country"
                    className="w-full p-2 border rounded"
                    value={newClient.country}
                    onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Subsidiary"
                    className="w-full p-2 border rounded"
                    value={newClient.subsidiary}
                    onChange={(e) => setNewClient({ ...newClient, subsidiary: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <select
                    className="w-full p-2 border rounded"
                    value={newClient.section}
                    onChange={(e) => setNewClient({ ...newClient, section: e.target.value })}
                  >
                    <option value="Trade">Trade</option>
                    <option value="Broker">Broker</option>
                    <option value="Retail">Retail</option>
                  </select>
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    placeholder="Sales Rep Name"
                    className="w-full p-2 border rounded"
                    value={newClient.salesRepName}
                    onChange={(e) => setNewClient({ ...newClient, salesRepName: e.target.value })}
                  />
                </td>
                <td className="p-4">
                  <input
                    type="email"
                    placeholder="Sales Rep Email"
                    className="w-full p-2 border rounded"
                    value={newClient.salesRepEmail}
                    onChange={(e) => setNewClient({ ...newClient, salesRepEmail: e.target.value })}
                  />
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={handleSaveAdd} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                  <button onClick={handleCancelAdd} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                </td>
              </tr>
            )}

            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                {isEditing === client.id ? (
                  <>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.subsidiary}
                        onChange={(e) => setEditForm({ ...editForm, subsidiary: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <select
                        className="w-full p-2 border rounded"
                        value={editForm.section}
                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      >
                        <option value="Trade">Trade</option>
                        <option value="Broker">Broker</option>
                        <option value="Retail">Retail</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editForm.salesRepName}
                        onChange={(e) => setEditForm({ ...editForm, salesRepName: e.target.value })}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="email"
                        className="w-full p-2 border rounded"
                        value={editForm.salesRepEmail}
                        onChange={(e) => setEditForm({ ...editForm, salesRepEmail: e.target.value })}
                      />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><Save size={20} /></button>
                      <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-800"><X size={20} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4 font-medium text-slate-800">{client.name}</td>
                    <td className="p-4 text-slate-600">{client.country}</td>
                    <td className="p-4 text-slate-600">{client.subsidiary || '-'}</td>
                    <td className="p-4 text-slate-600">{client.section || '-'}</td>
                    <td className="p-4 text-slate-600">{client.salesRepName}</td>
                    <td className="p-4 text-slate-600">{client.salesRepEmail}</td>
                    {!isReadOnly && (
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEditClick(client)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteClient(client.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            
            {!isAdding && clients.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No clients defined yet. Click "Add Client" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </MaximizeWrapper>
    </div>
  );
};

export default ClientManagementScreen;
