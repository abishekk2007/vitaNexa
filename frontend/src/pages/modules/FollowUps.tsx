import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowUps = async () => {
      try {
        const response = await api.get('/follow-ups');
        setFollowUps(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowUps();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">High-Risk Follow-ups</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {followUps.length > 0 ? followUps.map((fu: any) => {
            const isOverdue = new Date(fu.dueDate) < new Date() && fu.status !== 'COMPLETED';
            return (
              <div key={fu.id} className={`bg-white p-4 rounded shadow border-l-4 ${isOverdue ? 'border-red-500' : 'border-green-500'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{fu.category}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${fu.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {fu.status}
                  </span>
                </div>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                  Due Date: {new Date(fu.dueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                </p>
                {fu.notes && <p className="text-sm text-gray-700 mt-2">{fu.notes}</p>}
              </div>
            );
          }) : (
            <p>No follow-ups needed at this time.</p>
          )}
        </div>
      )}
    </div>
  );
}
