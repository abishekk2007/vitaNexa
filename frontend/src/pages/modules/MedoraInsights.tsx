import { useState, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';

interface Provider {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  patients: number;
  available: string;
  emoji: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const AREAS = ['New York', 'Los Angeles', 'Chicago'];
const SERVICES = ['Cardiology', 'Neurology', 'General Practice'];

const TIMES = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];

const PROVIDERS_DB: Record<string, Record<string, Provider[]>> = {
  'New York': {
    Cardiology: [
      { id: 1, name: 'Dr. James Hartwell', specialty: 'Cardiology', rating: 4.9, patients: 1240, available: 'Today 3PM', emoji: '👨‍⚕️' },
      { id: 2, name: 'Dr. Priya Nair', specialty: 'Cardiology', rating: 4.8, patients: 980, available: 'Tomorrow 10AM', emoji: '👩‍⚕️' },
    ],
    Neurology: [
      { id: 3, name: 'Dr. Marcus Levi', specialty: 'Neurology', rating: 4.7, patients: 760, available: 'Today 5PM', emoji: '👨‍⚕️' },
    ],
    'General Practice': [
      { id: 4, name: 'Dr. Sofia Mendez', specialty: 'General Practice', rating: 4.6, patients: 2100, available: 'Today 1PM', emoji: '👩‍⚕️' },
      { id: 5, name: 'Dr. Alan Brooks', specialty: 'General Practice', rating: 4.5, patients: 1800, available: 'Tomorrow 9AM', emoji: '👨‍⚕️' },
    ],
  },
  'Los Angeles': {
    Cardiology: [
      { id: 6, name: 'Dr. Rachel Kim', specialty: 'Cardiology', rating: 4.9, patients: 1540, available: 'Today 2PM', emoji: '👩‍⚕️' },
    ],
    Neurology: [
      { id: 7, name: 'Dr. David Osei', specialty: 'Neurology', rating: 4.8, patients: 890, available: 'Tomorrow 11AM', emoji: '👨‍⚕️' },
    ],
    'General Practice': [
      { id: 8, name: 'Dr. Linda Torres', specialty: 'General Practice', rating: 4.7, patients: 2300, available: 'Today 4PM', emoji: '👩‍⚕️' },
    ],
  },
  Chicago: {
    Cardiology: [
      { id: 9, name: 'Dr. Nathan Webb', specialty: 'Cardiology', rating: 4.6, patients: 1100, available: 'Tomorrow 2PM', emoji: '👨‍⚕️' },
    ],
    Neurology: [
      { id: 10, name: 'Dr. Aisha Patel', specialty: 'Neurology', rating: 4.9, patients: 670, available: 'Today 6PM', emoji: '👩‍⚕️' },
    ],
    'General Practice': [
      { id: 11, name: 'Dr. Chris Owens', specialty: 'General Practice', rating: 4.5, patients: 1950, available: 'Tomorrow 8AM', emoji: '👨‍⚕️' },
    ],
  },
};

function mockAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('headache') || lower.includes('migraine')) {
    return 'Headaches can stem from stress, dehydration, or underlying conditions. For persistent pain, consider seeing a neurologist. Would you like me to help find one near you?';
  }
  if (lower.includes('chest') || lower.includes('heart')) {
    return 'Chest discomfort should always be evaluated by a professional. I recommend consulting a cardiologist soon. Can I help you book an appointment?';
  }
  if (lower.includes('appointment') || lower.includes('book') || lower.includes('schedule')) {
    return 'I can help you book an appointment! First, select your area and specialty above, then choose a provider and book a slot.';
  }
  if (lower.includes('specialist') || lower.includes('doctor') || lower.includes('find')) {
    return 'You can search for specialists using the form above. Select your area and the type of care you need, and I\'ll show you available providers.';
  }
  if (lower.includes('symptom') || lower.includes('pain') || lower.includes('hurt')) {
    return 'I can provide general information about symptoms, but please consult a doctor for an accurate diagnosis. Would you like help finding the right specialist?';
  }
  if (lower.includes('thank')) {
    return "You're welcome! Feel free to ask if you need anything else. 😊";
  }
  if (lower.includes('hello') || lower.includes('hi ') || lower === 'hi') {
    return 'Hello! How can I help you today? I can assist with finding specialists, booking appointments, or answering health-related questions.';
  }
  return "That's a great question. For personalized medical advice, please consult with a healthcare professional. Can I help you find a specialist or book an appointment?";
}

function generateBookingSummary(name: string, doctor: Provider, date: string, time: string, reason: string): string {
  return `Hello ${name}! Your appointment with ${doctor.name} (${doctor.specialty}) has been confirmed for ${date} at ${time}.${reason ? ` We've noted your reason for visit: ${reason}.` : ''} Please arrive 15 minutes early with your ID and insurance card. A confirmation email has been sent to your registered email address.`;
}

function LineChart() {
  return (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,60 L20,50 L40,55 L60,35 L80,40 L100,25 L120,30 L140,15 L160,20" fill="none" stroke="#0ea5e9" strokeWidth="2" />
      <path d="M0,60 L20,50 L40,55 L60,35 L80,40 L100,25 L120,30 L140,15 L160,20 L160,80 L0,80Z" fill="url(#cg)" />
      <path d="M0,70 L20,65 L40,68 L60,55 L80,58 L100,45 L120,48 L140,38 L160,42" fill="none" stroke="#14b8a6" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

function GaugeChart() {
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      <path d="M10,50 A40,40 0 0,1 70,18" fill="none" stroke="url(#gg)" strokeWidth="8" strokeLinecap="round" />
      <text x="50" y="45" textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="bold">85</text>
      <text x="50" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">HEALTH</text>
    </svg>
  );
}

function AIChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm Medora AI. Ask me anything about symptoms, services, appointments, or finding the right specialist." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setTimeout(() => {
      const reply = mockAIResponse(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-24 right-6 w-[360px] h-[480px] bg-white border border-slate-200 rounded-2xl flex flex-col z-[100] shadow-xl">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-sm">🧬</div>
          <div>
            <div className="font-bold text-sm text-slate-800">Medora AI</div>
            <div className="text-[10px] text-emerald-600">● Online</div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg border-0 bg-transparent cursor-pointer">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-[14px_14px_4px_14px]'
                : 'bg-slate-100 text-slate-700 rounded-[14px_14px_14px_4px]'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-3.5 py-2.5 rounded-[14px_14px_14px_4px] text-xs text-slate-400">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Medora AI…"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 outline-none placeholder-slate-400"
        />
        <button onClick={sendMessage} className="bg-gradient-to-br from-sky-500 to-emerald-500 border-0 rounded-lg px-3.5 text-white cursor-pointer text-sm">↑</button>
      </div>
    </div>
  );
}

function BookingModal({ doctor, onClose, addToast }: { doctor: Provider; onClose: () => void; addToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', date: '', time: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setAiSummary(generateBookingSummary(form.name, doctor, form.date, form.time, form.reason));
    setLoading(false);
    setStep(3);
    addToast('Appointment booked successfully!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 w-[440px] max-w-[90vw] relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl border-0 bg-transparent cursor-pointer">✕</button>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-sm ${s <= step ? 'bg-gradient-to-r from-sky-500 to-emerald-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        {step === 1 && (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1.5">Book Appointment</h2>
            <p className="text-slate-500 text-xs mb-5">with {doctor.emoji} {doctor.name}</p>
            <div className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="input-field" />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email Address" type="email" className="input-field" />
              <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Reason for visit (optional)" className="input-field" />
            </div>
            <button onClick={() => setStep(2)} disabled={!form.name || !form.email} className={`btn-primary mt-5 w-full ${(!form.name || !form.email) ? 'opacity-50' : ''}`}>
              Choose Date & Time →
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">Pick a Slot</h2>
            <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date" className="input-field mb-4" min={new Date().toISOString().split('T')[0]} />
            <div className="grid grid-cols-3 gap-2 mb-5">
              {TIMES.map(t => (
                <button key={t} onClick={() => setForm({ ...form, time: t })} className={`px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  form.time === t
                    ? 'border-2 border-sky-500 bg-sky-50 text-sky-700'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={handleSubmit} disabled={!form.date || !form.time || loading} className={`btn-primary flex-[2] ${(!form.date || !form.time) ? 'opacity-50' : ''}`}>
                {loading ? 'Confirming…' : 'Confirm Appointment ✓'}
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-extrabold text-emerald-600 mb-3">Appointment Confirmed!</h2>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 text-sm text-slate-600 leading-relaxed text-left">
              {aiSummary}
            </div>
            <div className="text-xs text-slate-500 mb-4 leading-relaxed">
              📅 {form.date} at {form.time}<br />
              👨‍⚕️ {doctor.name} · {doctor.specialty}<br />
              ✉️ Confirmation sent to {form.email}
            </div>
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MedoraInsights() {
  const { addToast } = useToast();
  const [area, setArea] = useState('');
  const [service, setService] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [bookingDoc, setBookingDoc] = useState<Provider | null>(null);

  const findProviders = async () => {
    if (!area || !service) {
      addToast('Please select both area and service type.', 'warning');
      return;
    }
    setSearching(true);
    setSearched(false);
    await new Promise(r => setTimeout(r, 900));
    const results = PROVIDERS_DB[area]?.[service] || [];
    setProviders(results);
    setSearched(true);
    setSearching(false);
    if (results.length === 0) {
      addToast('No providers found for that combination. Try another area.', 'info');
    } else {
      addToast(`Found ${results.length} provider${results.length > 1 ? 's' : ''} near you!`, 'success');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {bookingDoc && <BookingModal doctor={bookingDoc} onClose={() => setBookingDoc(null)} addToast={addToast} />}
      {chatOpen && <AIChatPanel onClose={() => setChatOpen(false)} />}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-emerald-50 border border-slate-200 p-5 sm:p-8 lg:p-12 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-500/5 to-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-sky-500/5 to-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="min-w-0">
            <h1 className="text-[clamp(22px,3.5vw,48px)] font-black leading-tight uppercase mb-3 sm:mb-5">
              <span className="bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-600 bg-clip-text text-transparent">
                A New Dimension of Care: Intuitive, Data-Driven, Human.
              </span>
            </h1>
            <p className="text-slate-500 text-fluid-xs sm:text-sm leading-relaxed max-w-[420px] mb-4 sm:mb-7">
              Medora is an AI-powered medical platform built to transform how you discover, connect with, and experience healthcare. Smart matching. Real-time availability. Human-centered care.
            </p>
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-center shadow-sm flex-1 sm:flex-none">
                <div className="text-fluid-lg sm:text-2xl font-bold text-sky-600">500+</div>
                <div className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Verified Doctors</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-center shadow-sm flex-1 sm:flex-none">
                <div className="text-fluid-lg sm:text-2xl font-bold text-emerald-600">50K+</div>
                <div className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Happy Patients</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-5 py-2 sm:py-3 text-center shadow-sm flex-1 sm:flex-none">
                <div className="text-fluid-lg sm:text-2xl font-bold text-sky-600">98%</div>
                <div className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Satisfaction</div>
              </div>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-2">Patient Recovery Trend</p>
              <div className="h-20"><LineChart /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-400 mb-2">Overall Health Score</p>
              <div className="h-20"><GaugeChart /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 shadow-sm">
              <p className="text-xs text-slate-400 mb-2">Today's Activity</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-sky-600">12</div>
                  <div className="text-[10px] text-slate-400">Appointments</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">8</div>
                  <div className="text-[10px] text-slate-400">Consultations</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-sky-600">4</div>
                  <div className="text-[10px] text-slate-400">Procedures</div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">95%</div>
                  <div className="text-[10px] text-slate-400">Bed Occupancy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="r-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-fluid-lg sm:text-xl font-bold text-slate-800 font-fraunces">Find a Healthcare Provider</h2>
            <p className="text-fluid-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Search available doctors and specialists in your area</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-fluid-xs text-slate-400 whitespace-nowrap">🔍 {providers.length} provider{providers.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <select value={area} onChange={e => setArea(e.target.value)} className="input-field sm:flex-1">
            <option value="">Select Area</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={service} onChange={e => setService(e.target.value)} className="input-field sm:flex-1">
            <option value="">Select Service</option>
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={findProviders} disabled={searching} className={`btn-primary sm:w-auto ${searching ? 'opacity-50' : ''}`}>
            {searching ? 'Searching…' : 'Find Providers'}
          </button>
        </div>
        {searching && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-shimmer shadow-sm">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
        {!searching && searched && providers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏥</div>
            <p className="text-slate-500 text-sm">No providers found for that combination. Try another area or service.</p>
          </div>
        )}
        {!searching && providers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {providers.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-sky-500/10 to-emerald-500/10 flex items-center justify-center text-base sm:text-lg flex-shrink-0">{p.emoji}</div>
                    <div className="min-w-0">
                      <h3 className="text-fluid-sm font-semibold text-slate-800 truncate">{p.name}</h3>
                      <p className="text-fluid-xs text-slate-500 truncate">{p.specialty}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium whitespace-nowrap">{p.rating} ★</span>
                </div>
                <div className="flex items-center justify-between text-fluid-xs text-slate-500 mb-3 sm:mb-4">
                  <span>👥 {p.patients.toLocaleString()} patients</span>
                  <span>🕐 {p.available}</span>
                </div>
                <button onClick={() => setBookingDoc(p)} className="btn-primary w-full text-fluid-xs py-2 sm:py-2.5">
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        )}
        {!searched && !searching && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🧬</div>
            <p className="text-slate-500 text-fluid-xs sm:text-sm">Select your area and service type, then click <span className="text-sky-600 font-semibold">Find Providers</span> to discover healthcare professionals near you.</p>
          </div>
        )}
      </div>

      <div className="r-grid">
        <div className="r-card text-center hover:shadow-md hover:border-sky-200">
          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🩺</div>
          <h3 className="text-fluid-sm font-bold text-slate-800 mb-1 sm:mb-2">Verified Professionals</h3>
          <p className="text-fluid-xs text-slate-500">All providers are licensed and credential-verified by our medical board.</p>
        </div>
        <div className="r-card text-center hover:shadow-md hover:border-sky-200">
          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⚡</div>
          <h3 className="text-fluid-sm font-bold text-slate-800 mb-1 sm:mb-2">Real-Time Booking</h3>
          <p className="text-fluid-xs text-slate-500">See live availability and book appointments instantly with instant confirmation.</p>
        </div>
        <div className="r-card text-center hover:shadow-md hover:border-sky-200">
          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🤖</div>
          <h3 className="text-fluid-sm font-bold text-slate-800 mb-1 sm:mb-2">AI-Powered Matching</h3>
          <p className="text-fluid-xs text-slate-500">Medora AI helps match you with the right specialist based on your needs.</p>
        </div>
      </div>

      <button
        onClick={() => setChatOpen(o => !o)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white text-xl sm:text-2xl shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-105 transition-all z-50 flex items-center justify-center border-0 cursor-pointer r-touch"
        aria-label="Open AI Chat"
      >
        🧬
      </button>
    </div>
  );
}
