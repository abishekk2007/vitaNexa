import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/appointments');
        setAppointments(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Appointments & Queue</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Book Appointment</button>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {appointments.length > 0 ? appointments.map((apt: any) => (
            <div key={apt.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">{apt.facility?.name || 'Unknown Facility'}</h3>
                <span className="bg-gray-100 px-2 py-1 text-sm rounded">{apt.status}</span>
              </div>
              <p className="text-sm text-gray-600">Date: {new Date(apt.date).toLocaleDateString()} | Time: {apt.time || 'N/A'}</p>
              <p className="text-sm text-gray-600">Dept: {apt.department || 'General'}</p>
              <p className="text-sm font-mono mt-2">No: {apt.appointmentNumber}</p>
            </div>
          )) : (
            <p>No appointments found.</p>
          )}
        </div>
      )}
    </div>
  );
}
