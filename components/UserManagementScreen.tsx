import React, { useState } from 'react';
import { User, RoleDefinition, AppView, Permission } from '../types';
import { Plus, Edit2, Trash2, Shield, Users as UsersIcon, Save, X, Lock, Eye, PenLine } from 'lucide-react';
import * as api from '../services/api';

interface Props {
  users: User[];
  roles: RoleDefinition[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onAddRole: (role: RoleDefinition) => void;
  onUpdateRole: (role: RoleDefinition) => void;
  onDeleteRole: (id: string) => void;
}

const UserManagementScreen: React.FC<Props> = ({ 
  users, 
  roles, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser,
  onAddRole,
  onUpdateRole,
  onDeleteRole
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permSaved, setPermSaved] = useState<string | null>(null);

  React.useEffect(() => {
    api.getPermissions().then(setPermissions).catch(() => {
      setPermissions(users.map(u => ({ user_id: u.id, can_edit: u.permission ?? 1 })));
    });
  }, []);

  const getPermission = (userId: string) => {
    const p = permissions.find(p => p.user_id === userId);
    return p ? p.can_edit : 1;
  };

  const handleTogglePermission = async (userId: string, current: number) => {
    const newVal = current === 1 ? 0 : 1;
    setPermissions(prev => prev.map(p => p.user_id === userId ? { ...p, can_edit: newVal } : p));
    await api.updatePermission(userId, newVal);
    setPermSaved(userId);
    setTimeout(() => setPermSaved(null), 2000);
  };
  
  // User Form State
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});

  // Role Form State
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({ authorities: [] });

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || 'Unknown Role';
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm(user);
    setIsEditingUser(true);
  };

  const handleSaveUser = () => {
    if (!userForm.email || !userForm.name || !userForm.roleId) return;
    
    if (editingUserId) {
      onUpdateUser(userForm as User);
    } else {
      onAddUser({
        ...userForm,
        id: `user-${Date.now()}`
      } as User);
    }
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserForm({});
  };

  const handleEditRole = (role: RoleDefinition) => {
    setEditingRoleId(role.id);
    setRoleForm(role);
    setIsEditingRole(true);
  };

  const handleSaveRole = () => {
    if (!roleForm.name) return;
    
    if (editingRoleId) {
      onUpdateRole(roleForm as RoleDefinition);
    } else {
      onAddRole({
        ...roleForm,
        id: `role-${Date.now()}`,
        authorities: roleForm.authorities || []
      } as RoleDefinition);
    }
    setIsEditingRole(false);
    setEditingRoleId(null);
    setRoleForm({ authorities: [] });
  };

  const toggleAuthority = (view: AppView) => {
    const currentAuthorities = roleForm.authorities || [];
    if (currentAuthorities.includes(view)) {
      setRoleForm({ ...roleForm, authorities: currentAuthorities.filter(a => a !== view) });
    } else {
      setRoleForm({ ...roleForm, authorities: [...currentAuthorities, view] });
    }
  };

  const allViews = Object.values(AppView).filter(v => typeof v === 'number') as AppView[];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User & Role Management</h1>
          <p className="text-slate-500">Define users, roles, and their access authorities.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'users' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Users
          </div>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles & Authorities
          </div>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Permissions
          </div>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setUserForm({});
                setEditingUserId(null);
                setIsEditingUser(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          {isEditingUser && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800">{editingUserId ? 'Edit User' : 'New User'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={userForm.name || ''}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email || ''}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={userForm.roleId || ''}
                    onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subsidiary (Optional)</label>
                  <input
                    type="text"
                    value={userForm.subsidiary || ''}
                    onChange={e => setUserForm({ ...userForm, subsidiary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setIsEditingUser(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={!userForm.name || !userForm.email || !userForm.roleId}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save User
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Subsidiary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleName(user.roleId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.subsidiary || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Permission Control</p>
            <p>Set each user as an <strong>Editor (1)</strong> — can add/edit/delete data — or a <strong>Viewer (0)</strong> — read-only access.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Permission Value</th>
                  <th className="px-6 py-4 text-center">Access Level</th>
                  <th className="px-6 py-4 text-center">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map(user => {
                  const canEdit = getPermission(user.id);
                  const isSaved = permSaved === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                      <td className="px-6 py-4 text-slate-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleName(user.roleId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-lg font-bold ${canEdit === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {canEdit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {canEdit === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <PenLine className="w-3 h-3" /> Editor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            <Eye className="w-3 h-3" /> Viewer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleTogglePermission(user.id, canEdit)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${canEdit === 1 ? 'bg-green-500' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${canEdit === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          {isSaved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Permissions Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600 text-white font-bold text-lg">1</span>
                <div>
                  <p className="font-semibold text-green-800">Editor</p>
                  <p className="text-sm text-green-700 mt-0.5">Can create, edit, and delete records. Full write access to the system.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-500 text-white font-bold text-lg">0</span>
                <div>
                  <p className="font-semibold text-slate-700">Viewer</p>
                  <p className="text-sm text-slate-600 mt-0.5">Read-only access. Can view all data but cannot make any changes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Role Authorities Note</p>
            <p>Only administrators can amend roles and authorities. These settings determine which pages a user can view and interact with.</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setRoleForm({ authorities: [] });
                setEditingRoleId(null);
                setIsEditingRole(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          </div>

          {isEditingRole && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800">{editingRoleId ? 'Edit Role' : 'New Role'}</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={roleForm.name || ''}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Authorities (Pages Accessible)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allViews.map(view => (
                    <label 
                      key={view} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        roleForm.authorities?.includes(view) 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.authorities?.includes(view) || false}
                        onChange={() => toggleAuthority(view)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm ${roleForm.authorities?.includes(view) ? 'font-medium text-blue-900' : 'text-slate-700'}`}>
                        {AppView[view].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditingRole(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={!roleForm.name}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Role
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      {role.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {users.filter(u => u.roleId === role.id).length} users assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {role.name !== 'Admin' && (
                      <button
                        onClick={() => {
                          if (users.some(u => u.roleId === role.id)) {
                            alert('Cannot delete role while users are assigned to it.');
                            return;
                          }
                          if (window.confirm('Are you sure you want to delete this role?')) {
                            onDeleteRole(role.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Authorities</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.authorities.map(view => (
                      <span 
                        key={view}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {AppView[view].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                    {role.authorities.length === 0 && (
                      <span className="text-sm text-slate-400 italic">No authorities assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementScreen;
