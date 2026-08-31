import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      addToast('Message sent! We\'ll get back to you soon.', 'success');
    } catch {
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-800 font-fraunces">Vita<span className="text-sky-500">Nexa</span></Link>
          <Link to="/" className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-medium">Home</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-slate-800 font-fraunces mb-4">Contact Us</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Have a question, suggestion, or need help? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <span className="text-3xl mb-3 block">📧</span>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Email</h3>
              <p className="text-slate-500">support@vitanexa.com</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <span className="text-3xl mb-3 block">📍</span>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Location</h3>
              <p className="text-slate-500">San Francisco, CA 94105</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <span className="text-3xl mb-3 block">🕐</span>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Hours</h3>
              <p className="text-slate-500">Mon-Fri, 9 AM - 6 PM PST</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50">
              <span className="text-3xl mb-3 block">💬</span>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Social</h3>
              <p className="text-slate-500">Follow us on Twitter, LinkedIn, and GitHub</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-200/50 animate-slide-up">
            {sent ? (
              <div className="text-center py-12">
                <span className="text-5xl mb-4 block">✅</span>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 font-fraunces">Message Sent!</h2>
                <p className="text-slate-500 mb-6">Thank you for reaching out. We'll respond within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="btn-secondary">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 font-fraunces">Send a Message</h2>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    id="name" type="text" value={form.name}
                    onChange={(e) => update('name', e.target.value)} required
                    className="input-field" placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    id="email" type="email" value={form.email}
                    onChange={(e) => update('email', e.target.value)} required
                    className="input-field" placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                  <input
                    id="subject" type="text" value={form.subject}
                    onChange={(e) => update('subject', e.target.value)} required
                    className="input-field" placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <textarea
                    id="message" value={form.message}
                    onChange={(e) => update('message', e.target.value)} required rows={5}
                    className="input-field" placeholder="Tell us more..."
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
