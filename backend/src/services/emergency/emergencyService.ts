import { PrismaClient } from '@prisma/client';
import { smsProvider, sendWithRetry } from './smsProvider';
import { voiceProvider, callWithEscalation } from './voiceProvider';
import { getLocationFromIp } from './locationService';
import { findNearestHospitals } from './hospitalLocatorService';
import { getContacts, toE164 } from './emergencyContactService';
import { searchHospitals } from './overpassService';

const prisma = new PrismaClient();

const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

interface SosInput {
  description?: string;
  symptoms?: string;
  medicalSnapshot?: string;
  contactMethod?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  accuracy?: number;
}

export async function triggerSos(userId: string, ip: string, input: SosInput) {
  const recentCount = await prisma.emergencyEvent.count({
    where: { userId, status: 'ACTIVE' },
  });
  if (recentCount > 0) {
    const existing = await prisma.emergencyEvent.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { notifications: { include: { contact: true }, orderBy: { createdAt: 'desc' } } },
    });
    return { event: existing, message: 'You already have an active SOS event' };
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
  const sosCount = await prisma.emergencyEvent.count({
    where: { userId, createdAt: { gte: windowStart } },
  });
  if (sosCount >= RATE_LIMIT_MAX) {
    console.warn(`[EMERGENCY] Rate limit exceeded for user ${userId}`);
  }

  let latitude = input.latitude;
  let longitude = input.longitude;
  let locationName = input.locationName;

  if (!latitude || !longitude) {
    try {
      const ipLocation = await getLocationFromIp(ip);
      if (ipLocation) {
        latitude = ipLocation.latitude;
        longitude = ipLocation.longitude;
        locationName = locationName || ipLocation.locationName;
      }
    } catch { }
  }

  const event = await prisma.emergencyEvent.create({
    data: {
      userId,
      status: 'ACTIVE',
      latitude,
      longitude,
      locationName,
      description: input.description,
      symptoms: input.symptoms,
      medicalSnapshot: input.medicalSnapshot,
      contactMethod: input.contactMethod || 'SMS',
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: 'SOS_TRIGGER', entity: 'EmergencyEvent', entityId: event.id, details: `SOS triggered at ${locationName || `${latitude},${longitude}` || 'unknown location'}` },
  });

  notifyContacts(userId, event.id, latitude || undefined, longitude || undefined).catch(err =>
    console.error('[EMERGENCY] Contact notification failed:', err)
  );

  return { event, message: 'SOS triggered successfully' };
}

async function notifyContacts(userId: string, eventId: string, lat?: number, lng?: number) {
  const contacts = await getContacts(userId);
  const event = await prisma.emergencyEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const mapsLink = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : '';
  const userName = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name || 'Someone';

  for (const contact of contacts) {
    const message = `VitaNexa Emergency Alert\n\n${userName} may require immediate assistance.\n\nLive Location:\n${mapsLink || 'Location unavailable'}\n\nPlease contact immediately.`;

    if (event.contactMethod === 'SMS' || event.contactMethod === 'BOTH') {
      const smsResult = await sendWithRetry(smsProvider, contact.phone, message, 3);
      await prisma.emergencyNotification.create({
        data: {
          eventId,
          contactId: contact.id,
          method: 'SMS',
          status: smsResult.success ? 'SENT' : 'FAILED',
          message,
          sentAt: smsResult.success ? new Date() : undefined,
          error: smsResult.error,
        },
      });
    }

    if (event.contactMethod === 'BOTH' || event.contactMethod === 'VOICE') {
      const voiceMessage = `This is an emergency alert from VitaNexa. ${userName} needs help immediately. Please check your messages for the live location.`;
      const voiceResult = await voiceProvider.call(contact.phone, voiceMessage);
      await prisma.emergencyNotification.create({
        data: {
          eventId,
          contactId: contact.id,
          method: 'VOICE',
          status: voiceResult.success ? 'SENT' : 'FAILED',
          message: voiceMessage,
          sentAt: voiceResult.success ? new Date() : undefined,
          error: voiceResult.error,
        },
      });
    }
  }

  if (event.contactMethod === 'BOTH' || event.contactMethod === 'VOICE') {
    const voiceContacts = contacts.map(c => ({ phone: c.phone, priority: c.priority, name: c.name }));
    callWithEscalation(voiceProvider, voiceContacts,
      `This is an emergency alert from VitaNexa. Please respond immediately.`,
      60000
    ).catch(err => console.error('[EMERGENCY] Voice escalation failed:', err));
  }
}

export async function cancelSos(userId: string, eventId: string) {
  const event = await prisma.emergencyEvent.findFirst({
    where: { id: eventId, userId, status: 'ACTIVE' },
  });
  if (!event) throw new Error('Active SOS event not found');
  const updated = await prisma.emergencyEvent.update({
    where: { id: eventId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { userId, action: 'SOS_CANCEL', entity: 'EmergencyEvent', entityId: eventId },
  });
  return updated;
}

export async function resolveSos(userId: string, eventId: string) {
  const event = await prisma.emergencyEvent.findFirst({
    where: { id: eventId, userId, status: 'ACTIVE' },
  });
  if (!event) throw new Error('Active SOS event not found');
  const updated = await prisma.emergencyEvent.update({
    where: { id: eventId },
    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: 'USER' },
  });
  await prisma.auditLog.create({
    data: { userId, action: 'SOS_RESOLVE', entity: 'EmergencyEvent', entityId: eventId },
  });
  return updated;
}

export async function getEventStatus(userId: string, eventId: string) {
  const event = await prisma.emergencyEvent.findFirst({
    where: { id: eventId, userId },
    include: { notifications: { include: { contact: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!event) throw new Error('Event not found');
  return event;
}

export async function getActiveEvent(userId: string) {
  return prisma.emergencyEvent.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { notifications: { include: { contact: true }, orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getEventHistory(userId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    prisma.emergencyEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.emergencyEvent.count({ where: { userId } }),
  ]);
  return { events, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getActiveEmergencies(admin: boolean = false) {
  if (!admin) throw new Error('Admin access required');
  return prisma.emergencyEvent.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      notifications: { include: { contact: true }, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getNearbyResources(lat: number, lng: number) {
  const [dbHospitals, overpassHospitals] = await Promise.all([
    findNearestHospitals(lat, lng, 5),
    searchHospitals(lat, lng, 5),
  ]);
  return {
    hospitals: overpassHospitals.slice(0, 10),
    dbHospitals: dbHospitals.slice(0, 5),
  };
}

export async function searchNearbyHospitals(lat: number, lng: number, radiusKm: number = 5) {
  return searchHospitals(lat, lng, radiusKm);
}

export async function getEmergencyStats(admin: boolean = false) {
  if (!admin) throw new Error('Admin access required');
  const [total, active, resolved, cancelled] = await Promise.all([
    prisma.emergencyEvent.count(),
    prisma.emergencyEvent.count({ where: { status: 'ACTIVE' } }),
    prisma.emergencyEvent.count({ where: { status: 'RESOLVED' } }),
    prisma.emergencyEvent.count({ where: { status: 'CANCELLED' } }),
  ]);
  return { total, active, resolved, cancelled };
}

export async function getAuditLogs(admin: boolean = false, page: number = 1, limit: number = 50) {
  if (!admin) throw new Error('Admin access required');
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { entity: { startsWith: 'Emergency' } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where: { entity: { startsWith: 'Emergency' } } }),
  ]);
  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
