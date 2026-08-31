import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { User, UserRole, UserStatus, USER_ROLES, USER_STATUSES } from '../../types';

function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div className="glass rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button onClick={onConfirm} className={confirmLabel?.includes('Delete') || confirmLabel?.includes('Suspend') ? 'px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'btn-primary text-sm'}>{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, open, onClose, onSaved }: { user: User | null; open: boolean; onClose: () => void; onSaved: (u: User) => void }) {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone || ''); }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${user.id}`, { name, phone });
      addToast('User updated', 'success');
      onSaved(data);
      onClose();
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Edit User: {user.name}</h3>
        <div className="space-y-3">
          <div><label className="block text-sm text-gray-400 mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="input-field w-full" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Email</label><input value={user.email} disabled className="input-field w-full opacity-60" /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input-field w-full" /></div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'badge-info', MODERATOR: 'badge-warning', RESEARCHER: 'badge-success',
    NUTRITIONIST: 'badge-success', DOCTOR: 'badge-error', USER: 'badge-warning',
  };
  return <span className={`badge ${colors[role] || 'badge-warning'}`}>{role}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', inactive: 'badge-error', suspended: 'badge-error', pending: 'badge-warning',
  };
  return <span className={`badge ${colors[status] || 'badge-warning'}`}>{status}</span>;
}

export default function AdminUsers() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; message: string; label: string; onAction: () => void } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 20;

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), search, sortBy, sortOrder });
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/users?${params}`);
      const usersData = data?.data ?? [];
      const totalCount = data?.pagination?.total ?? 0;
      setUsers(Array.isArray(usersData) ? usersData : []);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.statusText || err.message || 'Failed to load users';
      setError(msg);
      addToast(msg, 'error');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const changeRole = async (userId: string, role: UserRole) => {
    setActionId(userId);
    try {
      const { data } = await api.put(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.role } : u));
      addToast(`Role changed to ${role}`, 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to change role', 'error');
    } finally { setActionId(null); setConfirm(null); }
  };

  const changeStatus = async (userId: string, status: UserStatus) => {
    setActionId(userId);
    try {
      const { data } = await api.put(`/users/${userId}/status`, { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: data.status, isActive: data.isActive } : u));
      addToast(`Status changed to ${status}`, 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to change status', 'error');
    } finally { setActionId(null); setConfirm(null); }
  };

  const deleteUser = async (userId: string) => {
    setActionId(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setTotal(prev => prev - 1);
      addToast('User disabled', 'success');
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to disable user', 'error');
    } finally { setActionId(null); setConfirm(null); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Manage Users</h1>
        <p className="text-gray-400">View, search, filter, and manage all registered users</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email..." className="input-field flex-1 min-w-[200px]" />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="">All Roles</option>
            {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="">All Statuses</option>
            {USER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field w-auto">
            <option value="createdAt">Joined</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="lastLogin">Last Login</option>
          </select>
          <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="btn-secondary text-sm px-3 py-2">
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 glass rounded-xl border-l-4 border-red-500">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => loadUsers()} className="btn-primary text-xs mt-2">Retry</button>
          </div>
        )}

        {loading ? (
          <SkeletonTable rows={8} />
        ) : users.length === 0 && !error ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🔍</span>
            <p className="text-gray-400">No users found</p>
            {(search || roleFilter || statusFilter) && (
              <button onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }} className="btn-secondary mt-4">Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-left p-3 font-medium">Last Login</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <button onClick={() => setExpandedId(expandedId === u.id ? null : u.id)} className="font-medium text-white hover:text-emerald-400 transition-colors text-left">{u.name}</button>
                    </td>
                    <td className="p-3 text-gray-400">{u.email}</td>
                    <td className="p-3">
                      {actionId === u.id ? (
                        <span className="text-xs text-gray-500">Updating...</span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => {
                            const newRole = e.target.value as UserRole;
                            if (newRole !== u.role) {
                              setConfirm({
                                title: 'Change Role',
                                message: `Change ${u.name}'s role from ${u.role} to ${newRole}?`,
                                label: 'Change Role',
                                onAction: () => changeRole(u.id, newRole),
                              });
                            }
                          }}
                          className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs cursor-pointer hover:border-emerald-500/50 focus:outline-none focus:border-emerald-500"
                        >
                          {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => { setEditUser(u); setShowEditModal(true); }} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">Edit</button>
                        {u.status !== 'suspended' && (
                          <button onClick={() => setConfirm({ title: 'Suspend User', message: `Suspend ${u.name}? They will not be able to login.`, label: 'Suspend', onAction: () => changeStatus(u.id, 'suspended') })} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all">Suspend</button>
                        )}
                        {u.status === 'suspended' && (
                          <button onClick={() => setConfirm({ title: 'Activate User', message: `Activate ${u.name}? They will be able to login.`, label: 'Activate', onAction: () => changeStatus(u.id, 'active') })} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all">Activate</button>
                        )}
                        {u.status === 'inactive' && (
                          <button onClick={() => setConfirm({ title: 'Activate User', message: `Activate ${u.name}? They will be able to login.`, label: 'Activate', onAction: () => changeStatus(u.id, 'active') })} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all">Activate</button>
                        )}
                        <button onClick={() => setConfirm({ title: 'Disable User', message: `Disable ${u.name}? Their account will be set to inactive.`, label: 'Disable', onAction: () => changeStatus(u.id, 'inactive') })} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Disable</button>
                        <button onClick={() => setConfirm({ title: 'Delete User', message: `Delete ${u.name}? This permanently disables their account.`, label: 'Delete', onAction: () => deleteUser(u.id) })} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
            <span>Total: {total} user{total !== 1 ? 's' : ''}</span>
            <div className="flex gap-2 items-center">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 glass rounded-xl text-xs disabled:opacity-30 hover:bg-white/10 transition-all">Prev</button>
              <span className="px-3 text-xs">Page {page} of {totalPages || 1}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 glass rounded-xl text-xs disabled:opacity-30 hover:bg-white/10 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <EditUserModal user={editUser} open={showEditModal} onClose={() => setShowEditModal(false)} onSaved={(u) => setUsers(prev => prev.map(p => p.id === u.id ? { ...p, ...u } : p))} />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label}
        onConfirm={() => confirm?.onAction()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
