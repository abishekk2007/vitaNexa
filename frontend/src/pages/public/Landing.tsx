import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const features = [
  { to: '/microbiome', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', title: 'Microbiome Meal Planner', desc: 'Personalized food recommendations based on your gut bacteria analysis', color: 'from-sky-500 to-emerald-500' },
  { to: '/pain', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Pain Pattern Predictor', desc: 'Track and predict pain patterns with smart trigger detection', color: 'from-red-500 to-rose-500' },
  { to: '/nutrient', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', title: 'Nutrient Optimizer', desc: 'Optimize supplement timing and check for interactions', color: 'from-blue-500 to-indigo-500' },
  { to: '/energy', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Energy Ledger', desc: 'Manage your daily energy with spoon theory budgeting', color: 'from-amber-500 to-orange-500' },
  { to: '/petcare', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'Pet Care Emergency', desc: 'Pet profiles, mood tracking, and nearby veterinary clinics', color: 'from-violet-500 to-purple-500' },
  { to: '/emergency', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', title: 'Emergency Help', desc: 'Quick access to hospitals, ambulances, and volunteer drivers', color: 'from-rose-500 to-pink-500' },
  { to: '/bloodbank', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', title: 'Blood Bank Matching', desc: 'Connect blood donors with those in need instantly', color: 'from-red-500 to-rose-600' },
  { to: '/budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Smart Budget Saver', desc: 'Track savings goals with visual progress charts', color: 'from-green-500 to-emerald-500' },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '50K+', label: 'Health Logs' },
  { value: '500+', label: 'Hospitals' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Landing() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">📞 +1 463 281 6265</span>
            <span className="flex items-center gap-1.5">✉️ hello@vitanexa.com</span>
          </div>
          <span className="text-xs text-slate-400">🌐 EN ▾</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-slate-800 font-fraunces">Vita<span className="text-sky-500">Nexa</span></span>
            </div>
            <div className="hidden lg:flex items-center gap-7 text-sm">
              {['Home', 'Services', 'Doctors', 'AI Technology', 'Microbiome', 'Blood Bank', 'Emergency', 'Contact'].map((item, i) => (
                <a key={item} href="#" className={`${i === 0 ? 'text-sky-600 font-semibold' : 'text-slate-600 hover:text-sky-600'} transition-colors`}>{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-400">
                <span>🔍</span> Search
              </div>
              <Link to="/login" className="px-4 py-2 text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium">Sign In</Link>
              <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-sky-600 hover:to-emerald-600 transition-all shadow-md shadow-sky-500/20">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              AI-Powered Health Platform
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-[1.1] uppercase tracking-tight">
              <span className="bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-600 bg-clip-text text-transparent">
                A New Dimension of Care: Intuitive, Data-Driven, Human.
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mb-8 leading-relaxed">
              AI-powered tools for microbiome analysis, pain tracking, nutrient optimization,
              energy management, emergency services, and financial wellness — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-emerald-600 transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/50 text-base">
                Book Appointment
              </Link>
              <Link to="/register" className="px-8 py-4 border-2 border-sky-200 text-sky-700 font-semibold rounded-xl hover:bg-sky-50 hover:border-sky-300 transition-all text-base">
                Explore Insights
              </Link>
              <button className="px-8 py-4 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-base flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50">
              <p className="text-xs text-slate-400 mb-3">Patient Recovery Trend</p>
              <svg viewBox="0 0 160 80" className="w-full h-20">
                <defs>
                  <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,60 L20,50 L40,55 L60,35 L80,40 L100,25 L120,30 L140,15 L160,20" fill="none" stroke="#0ea5e9" strokeWidth="2" />
                <path d="M0,60 L20,50 L40,55 L60,35 L80,40 L100,25 L120,30 L140,15 L160,20 L160,80 L0,80Z" fill="url(#cg1)" />
                <path d="M0,70 L20,65 L40,68 L60,55 L80,58 L100,45 L120,48 L140,38 L160,42" fill="none" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
              </svg>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50">
              <p className="text-xs text-slate-400 mb-3">Health Score</p>
              <svg viewBox="0 0 100 60" className="w-full h-20">
                <defs>
                  <linearGradient id="gg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                <path d="M10,50 A40,40 0 0,1 70,18" fill="none" stroke="url(#gg1)" strokeWidth="8" strokeLinecap="round" />
                <text x="50" y="45" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="bold">85</text>
                <text x="50" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">OVERALL</text>
              </svg>
            </div>
            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg shadow-slate-200/50">
              <p className="text-xs text-slate-400 mb-3">Today's Activity</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-sky-500">12</div>
                  <div className="text-[10px] text-slate-400">Appointments</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-500">8</div>
                  <div className="text-[10px] text-slate-400">Consultations</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-sky-500">4</div>
                  <div className="text-[10px] text-slate-400">Procedures</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-500">95%</div>
                  <div className="text-[10px] text-slate-400">Bed Occupancy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-200/50 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center animate-slide-up stagger-${i + 1}`}>
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent font-fraunces">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-4 font-fraunces">
          Everything You Need
        </h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">
          Eight powerful modules designed to work together for your complete health journey
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Link
              key={f.title}
              to={f.to}
              className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-sky-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${f.color} opacity-5 rounded-bl-full transition-opacity duration-300 group-hover:opacity-20`} />
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-sky-500 to-emerald-500 rounded-3xl p-12 md:p-16 text-center shadow-xl shadow-sky-500/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-fraunces">
            Ready to Transform Your Health?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Join thousands of users who have taken control of their health journey with VitaNexa AI.
          </p>
          <Link to="/register" className="inline-block px-10 py-4 bg-white text-sky-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-lg shadow-black/10 text-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} VitaNexa AI. All rights reserved. Built with care for your health.</p>
      </footer>
    </div>
  );
}
