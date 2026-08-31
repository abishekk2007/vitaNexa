import { PrismaClient } from '@prisma/client';
import { smsProvider } from './smsProvider';

const prisma = new PrismaClient();

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.startsWith('+')) return digits;
  return digits.length > 12 ? `+${digits}` : `+91${digits}`;
}

export async function getContacts(userId: string) {
  return prisma.emergencyContact.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: 'asc' },
  });
}

export async function getContactById(userId: string, contactId: string) {
  return prisma.emergencyContact.findFirst({
    where: { id: contactId, userId },
  });
}

export async function createContact(userId: string, data: {
  name: string; phone: string; priority?: number; relation?: string; consentGiven?: boolean;
}) {
  const phone = toE164(data.phone);
  const maxPriority = await prisma.emergencyContact.findFirst({
    where: { userId },
    orderBy: { priority: 'desc' },
    select: { priority: true },
  });
  const priority = data.priority ?? (maxPriority ? maxPriority.priority + 1 : 1);
  return prisma.emergencyContact.create({
    data: { userId, name: data.name, phone, priority, relation: data.relation, consentGiven: data.consentGiven ?? true },
  });
}

export async function updateContact(userId: string, contactId: string, data: {
  name?: string; phone?: string; priority?: number; relation?: string; isVerified?: boolean; consentGiven?: boolean; isActive?: boolean;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = toE164(data.phone);
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.relation !== undefined) updateData.relation = data.relation;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
  if (data.consentGiven !== undefined) updateData.consentGiven = data.consentGiven;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  return prisma.emergencyContact.updateMany({
    where: { id: contactId, userId },
    data: updateData,
  });
}

export async function deleteContact(userId: string, contactId: string) {
  return prisma.emergencyContact.updateMany({
    where: { id: contactId, userId },
    data: { isActive: false },
  });
}

export async function reorderContacts(userId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.emergencyContact.updateMany({
      where: { id, userId },
      data: { priority: index + 1 },
    })
  );
  await Promise.all(updates);
  return getContacts(userId);
}

export async function sendTestAlert(userId: string, contactId: string) {
  const contact = await prisma.emergencyContact.findFirst({ where: { id: contactId, userId } });
  if (!contact) throw new Error('Contact not found');
  const message = `[VitaNexa TEST] This is a test emergency alert from ${contact.name}. No action needed.`;
  const result = await smsProvider.send(contact.phone, message);
  return { contact, result };
}

export { toE164 };
