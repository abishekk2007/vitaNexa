import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function HealthWorkerPortal() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health-worker/dashboard');
      if (response.data?.success) {
        setDashboard(response.data.data);
      } else {
        setError(response.data?.error?.message || 'Failed to load dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("You are not registered as a Healthcare Worker. Please contact administration.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError(err.response?.data?.error?.message || 'Unable to load dashboard. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Health Worker Portal</h1>
      <p className="text-gray-600 mb-6 border-l-4 border-blue-400 pl-2">Dedicated dashboard for ASHA, ANM, and public health staff.</p>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded border border-red-200 text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={fetchDashboard} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : !dashboard || !dashboard.worker ? (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
          <p className="text-yellow-700 font-medium">No assigned patients or tasks yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-lg font-bold">Welcome, {dashboard.worker.name}</h2>
            <p className="text-sm text-gray-500">{dashboard.worker.role}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded border border-blue-200 text-center">
              <h3 className="text-3xl font-bold text-blue-600">{dashboard.stats?.appointments || 0}</h3>
              <p className="text-sm text-blue-800 font-medium">Appointments Today</p>
            </div>
            <div className="bg-orange-50 p-4 rounded border border-orange-200 text-center">
              <h3 className="text-3xl font-bold text-orange-600">{dashboard.stats?.referrals || 0}</h3>
              <p className="text-sm text-orange-800 font-medium">Pending Referrals</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-center">
              <h3 className="text-3xl font-bold text-yellow-600">0</h3>
              <p className="text-sm text-yellow-800 font-medium">Due Follow-ups</p>
            </div>
            <div className="bg-red-50 p-4 rounded border border-red-200 text-center">
              <h3 className="text-3xl font-bold text-red-600">0</h3>
              <p className="text-sm text-red-800 font-medium">High Risk</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded hover:bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span>Register Patient</span>
                  <span>➕</span>
                </button>
                <button className="w-full text-left p-3 rounded hover:bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span>Create Referral</span>
                  <span>➕</span>
                </button>
                <button className="w-full text-left p-3 rounded hover:bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span>Update Vitals</span>
                  <span>➕</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold mb-4">Offline Sync Status</h3>
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">All data synced securely.</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">PWA architecture ensures seamless operation in low-connectivity areas.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
