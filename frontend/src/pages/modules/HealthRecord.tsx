import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function HealthRecord() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await api.get('/health-record');
        setRecords(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Longitudinal Health Record</h1>
      <p className="text-gray-600 mb-6">A unified timeline of your healthcare visits, prescriptions, and lab reports.</p>
      
      {loading ? (
        <div>Loading timeline...</div>
      ) : (
        <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-8">
          {records.length > 0 ? records.map((record: any) => (
            <div key={record.id} className="relative">
              <div className="absolute -left-9 mt-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
              <div className="bg-white p-4 rounded shadow">
                <span className="text-xs text-blue-600 font-bold uppercase">{record.type}</span>
                <h3 className="text-lg font-bold">{record.title}</h3>
                <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                {record.description && <p className="mt-2 text-gray-700">{record.description}</p>}
                
                {record.events && record.events.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold mb-2">Events</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {record.events.map((evt: any) => (
                        <li key={evt.id}>{evt.eventType}: {evt.details}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <p>No health records found.</p>
          )}
        </div>
      )}
    </div>
  );
}
