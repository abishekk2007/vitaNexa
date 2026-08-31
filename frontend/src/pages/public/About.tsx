import { Link } from 'react-router-dom';

const teamMembers = [
  { name: 'Dr. Sarah Chen', role: 'Founder & CEO', bio: 'Health-tech innovator with 15+ years in digital health' },
  { name: 'Marcus Rivera', role: 'CTO', bio: 'Full-stack engineer passionate about accessible healthcare' },
  { name: 'Dr. Priya Patel', role: 'Medical Advisor', bio: 'Gastroenterologist specializing in gut microbiome research' },
];

const values = [
  { title: 'Accessibility', desc: 'Making health tools available to everyone, regardless of background', icon: '🌍' },
  { title: 'Privacy First', desc: 'Your health data belongs to you. We prioritize security and transparency', icon: '🔒' },
  { title: 'Evidence-Based', desc: 'All features are grounded in peer-reviewed research and medical best practices', icon: '🔬' },
  { title: 'Community', desc: 'Building a supportive ecosystem where users help each other thrive', icon: '🤝' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-slate-800 font-fraunces">Vita<span className="text-sky-500">Nexa</span></Link>
          <Link to="/" className="text-slate-500 hover:text-sky-600 transition-colors text-sm font-medium">Home</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        <section className="text-center space-y-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 font-fraunces">
            About <span className="text-sky-500">VitaNexa</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to empower individuals with AI-driven tools for holistic health management.
            Combining cutting-edge technology with compassionate design.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 items-center animate-slide-up">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-200/50">
            <span className="text-4xl mb-4 block">🎯</span>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 font-fraunces">Our Mission</h2>
            <p className="text-slate-500 leading-relaxed">
              VitaNexa AI was born from a simple idea: health management should be intelligent, integrated, and
              accessible. We believe that by combining AI-powered insights with user-centered design, we can help
              people understand their bodies better, make informed decisions, and ultimately live healthier lives.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg shadow-slate-200/50">
            <span className="text-4xl mb-4 block">💡</span>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 font-fraunces">What We Do</h2>
            <p className="text-slate-500 leading-relaxed">
              From microbiome analysis and pain pattern prediction to energy budgeting and emergency assistance,
              we provide eight integrated modules that cover every aspect of your wellness journey. Each tool is
              built with love and designed to grow with you.
            </p>
          </div>
        </section>

        <section className="space-y-6 animate-slide-up">
          <h2 className="text-3xl font-bold text-slate-800 text-center font-fraunces">Platform Modules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Microbiome Meal Planner', icon: '🦠' },
              { name: 'Pain Pattern Predictor', icon: '📊' },
              { name: 'Nutrient Optimizer', icon: '💊' },
              { name: 'Energy Ledger', icon: '⚡' },
              { name: 'Pet Care Emergency', icon: '🐾' },
              { name: 'Emergency Help', icon: '🚨' },
              { name: 'Blood Bank Matching', icon: '🩸' },
              { name: 'Smart Budget Saver', icon: '💰' },
            ].map((m) => (
              <div key={m.name} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <span className="text-2xl mb-2 block">{m.icon}</span>
                <span className="text-sm text-slate-700">{m.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-slide-up">
          <h2 className="text-3xl font-bold text-slate-800 text-center font-fraunces">Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <span className="text-3xl mb-3 block">{v.icon}</span>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 animate-slide-up">
          <h2 className="text-3xl font-bold text-slate-800 text-center font-fraunces">Our Team</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {teamMembers.map((m) => (
              <div key={m.name} className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  {m.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{m.name}</h3>
                <p className="text-sm text-sky-600 mb-2 font-medium">{m.role}</p>
                <p className="text-sm text-slate-500">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center bg-gradient-to-br from-sky-500 to-emerald-500 rounded-2xl p-12 shadow-xl shadow-sky-500/20 animate-slide-up">
          <h2 className="text-3xl font-bold text-white mb-4 font-fraunces">Ready to Take Control?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Join thousands of users who are already transforming their health journey with VitaNexa AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="px-8 py-3 bg-white text-sky-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-lg">Get Started Free</Link>
            <Link to="/" className="px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">Learn More</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
