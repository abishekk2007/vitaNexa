import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { EmergencyContact } from '../types';

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get('/emergency/contacts');
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const createContact = async (c: { name: string; phone: string; priority?: number; relation?: string }) => {
    const { data } = await api.post('/emergency/contacts', c);
    await fetchContacts();
    return data as EmergencyContact;
  };

  const updateContact = async (id: string, c: Partial<EmergencyContact>) => {
    await api.put(`/emergency/contacts/${id}`, c);
    await fetchContacts();
  };

  const deleteContact = async (id: string) => {
    await api.delete(`/emergency/contacts/${id}`);
    await fetchContacts();
  };

  const reorderContacts = async (orderedIds: string[]) => {
    const { data } = await api.put('/emergency/contacts/reorder', { orderedIds });
    setContacts(data);
  };

  const sendTestAlert = async (id: string) => {
    const { data } = await api.post(`/emergency/contacts/${id}/test-alert`);
    return data;
  };

  return { contacts, loading, fetchContacts, createContact, updateContact, deleteContact, reorderContacts, sendTestAlert };
}
