import React, { useState } from 'react';

export default function DigitalTriage() {
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState<null | 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'>(null);

  const handleTriage = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = symptoms.toLowerCase();
    if (sym.includes('heart') || sym.includes('chest pain') || sym.includes('breath') || sym.includes('bleed')) {
      setUrgency('RED');
    } else if (sym.includes('fever') && sym.includes('high')) {
      setUrgency('ORANGE');
    } else if (sym.includes('pain') || sym.includes('cough')) {
      setUrgency('YELLOW');
    } else {
      setUrgency('GREEN');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Digital Triage</h1>
      <p className="text-sm text-gray-500 mb-6 border-l-4 border-yellow-400 pl-2">
        Disclaimer: VitaNexa provides decision-support information and does not replace professional medical diagnosis.
      </p>

      <form onSubmit={handleTriage} className="max-w-xl mb-8">
        <label className="block mb-2 font-medium">Describe your symptoms</label>
        <textarea
          className="w-full border p-2 rounded mb-4"
          rows={4}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="E.g., Mild fever, coughing for 2 days..."
          required
        ></textarea>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Analyze Symptoms
        </button>
      </form>

      {urgency && (
        <div className={`p-4 rounded border ${urgency === 'RED' ? 'bg-red-50 border-red-500' : urgency === 'ORANGE' ? 'bg-orange-50 border-orange-500' : urgency === 'YELLOW' ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'}`}>
          <h2 className="text-xl font-bold mb-2">
            Status: {urgency === 'RED' ? 'EMERGENCY' : urgency === 'ORANGE' ? 'URGENT' : urgency === 'YELLOW' ? 'PRIORITY' : 'ROUTINE'}
          </h2>
          <p>
            {urgency === 'RED' && 'Please seek emergency medical evaluation immediately. Call 108.'}
            {urgency === 'ORANGE' && 'Please visit a PHC or Hospital as soon as possible.'}
            {urgency === 'YELLOW' && 'Consider scheduling an appointment with a doctor.'}
            {urgency === 'GREEN' && 'Your symptoms appear to require routine consultation. Rest and monitor.'}
          </p>
          {urgency === 'RED' && (
            <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded font-bold">
              Call 108 Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
