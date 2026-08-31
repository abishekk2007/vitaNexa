import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      addToast('Reset instructions sent if the account exists', 'success');
    } catch {
      addToast('Failed to send reset email. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-fraunces mb-2">Check Your Email</h1>
          <p className="text-slate-500 mb-6">
            If an account exists with that email, we've sent password reset instructions.
          </p>
          <Link to="/login" className="text-sky-600 hover:text-sky-700 transition-colors text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 font-fraunces mb-2">Forgot Password</h1>
          <p className="text-slate-500 text-sm">Enter your email to receive reset instructions</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="input-field" placeholder="your@email.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
        <p className="text-center mt-6">
          <Link to="/login" className="text-sm text-sky-600 hover:text-sky-700 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
