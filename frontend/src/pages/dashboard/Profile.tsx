import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../api/client';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name, phone });
      updateUser(data);
      addToast('Profile updated!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 font-fraunces">Profile Settings</h1>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1">Phone</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
          </div>
          <div className="pt-2">
            <p className="text-sm text-slate-500 mb-1">Role: <span className="text-sky-600 font-medium">{user?.role}</span></p>
            <p className="text-sm text-slate-500">Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
