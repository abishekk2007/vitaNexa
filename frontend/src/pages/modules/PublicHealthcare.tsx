import React, { useState, useEffect } from 'react';
import api from '../../api/client';

export default function PublicHealthcare() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await api.get('/public-health/facilities');
        setFacilities(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Public Healthcare Access</h1>
      <p className="text-gray-600 mb-6">Find nearby government facilities, PHCs, CHCs, and District Hospitals.</p>
      
      {loading ? (
        <div>Loading facilities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.length > 0 ? facilities.map((facility: any) => (
            <div key={facility.id} className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-bold">{facility.name}</h2>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{facility.type}</span>
              <p className="text-sm mt-2">{facility.address}</p>
              {facility.emergency && <p className="text-red-500 text-sm mt-1">Emergency Available</p>}
            </div>
          )) : (
            <p>No facilities found. (Demo Data pending)</p>
          )}
        </div>
      )}
    </div>
  );
}
