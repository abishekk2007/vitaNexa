import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!token) {
      addToast('Invalid reset link', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      addToast('Password reset successful!', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Reset failed. The link may have expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 font-fraunces mb-2">Reset Password</h1>
          <p className="text-slate-500 text-sm">Choose a new password for your account</p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-slate-600 mb-2">Password reset successful!</p>
            <p className="text-sm text-slate-400">Redirecting to login...</p>
          </div>
        ) : !token ? (
          <div className="text-center py-4">
            <p className="text-red-700 mb-4">Invalid or missing reset token.</p>
            <button onClick={() => navigate('/forgot-password')} className="btn-secondary">
              Request New Reset Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
              <input
                id="password" type="password" value={form.password}
                onChange={(e) => update('password', e.target.value)} required minLength={6}
                className="input-field" placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-1.5">Confirm Password</label>
              <input
                id="confirmPassword" type="password" value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)} required minLength={6}
                className="input-field" placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {!done && (
          <p className="text-center mt-6">
            <button onClick={() => navigate('/login')} className="text-sm text-sky-600 hover:text-sky-700 transition-colors">
              Back to Login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
