import React, { useState } from 'react';
import api from '../../api/client';

export default function DigitalTriage() {
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/triage', {
        symptoms,
        symptom_duration: duration
      });

      if (response.data?.success) {
        setResult(response.data.data.aiResult);
      } else {
        setError(response.data?.error?.message || 'Failed to process triage');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred during triage processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Digital Triage Engine</h1>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
        <p className="text-sm text-yellow-800 font-medium">
          Disclaimer: VitaNexa AI provides decision-support information and does NOT replace professional medical diagnosis. 
          If you are experiencing a life-threatening emergency, call 108 immediately.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleTriage}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Describe your symptoms in detail</label>
            <textarea
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="E.g., High fever of 102F, severe headache, and neck stiffness..."
              required
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Duration of symptoms (Optional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="E.g., 2 days, since this morning..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || symptoms.length < 5}
            className={`w-full text-white font-bold py-3 rounded-lg flex items-center justify-center \${loading || symptoms.length < 5 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Analyzing...</>
            ) : 'Analyze Symptoms'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className={`p-6 rounded-lg border \${result.severity === 'EMERGENCY' ? 'bg-red-50 border-red-500' : result.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' : result.severity === 'MODERATE' ? 'bg-yellow-50 border-yellow-500' : 'bg-green-50 border-green-500'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              Urgency: {result.severity}
            </h2>
            <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold border shadow-sm">
              {result.urgency}
            </span>
          </div>
          
          <div className="bg-white bg-opacity-60 p-4 rounded-md mb-4">
            <h3 className="font-bold text-gray-800 mb-2">Recommended Action</h3>
            <p className="text-gray-800">{result.recommendation}</p>
          </div>

          {result.redFlags && result.redFlags.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold text-red-800 mb-2">⚠️ Red Flags Detected</h3>
              <ul className="list-disc pl-5 text-red-700">
                {result.redFlags.map((flag: string, idx: number) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {result.emergency && (
            <button className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold text-lg shadow-md flex items-center justify-center">
              <span className="mr-2">🚨</span> Call Emergency Services (108)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
