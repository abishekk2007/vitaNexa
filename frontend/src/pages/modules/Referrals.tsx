import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const response = await api.get('/referrals');
        setReferrals(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Referrals</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {referrals.length > 0 ? referrals.map((ref: any) => (
            <div key={ref.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 text-xs rounded text-white ${ref.priority === 'EMERGENCY' ? 'bg-red-500' : ref.priority === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  {ref.priority}
                </span>
                <span className="font-mono text-sm text-gray-500">{ref.status}</span>
              </div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="font-semibold">{ref.sourceFacility?.name || 'Unknown'}</p>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">To</p>
                  <p className="font-semibold">{ref.destinationFacility?.name || 'Unknown'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2"><strong>Reason:</strong> {ref.reason}</p>
              {ref.notes && <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {ref.notes}</p>}
            </div>
          )) : (
            <p>No referrals found.</p>
          )}
        </div>
      )}
    </div>
  );
}
