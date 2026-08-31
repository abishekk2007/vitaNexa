import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as emergencyService from '../services/emergency/emergencyService';
import * as contactService from '../services/emergency/emergencyContactService';
import { logEmergencyAction } from '../services/emergency/auditService';
import { sendTestSMS, sendSosSMS } from '../services/msg91';

const prisma = new PrismaClient();
const getIp = (req: Request): string => (req.ip as string) || '';
const getParam = (req: Request, name: string): string => String(req.params[name] || '');

export async function getContacts(req: Request, res: Response) {
  try {
    const contacts = await contactService.getContacts(req.user!.userId);
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getContact(req: Request, res: Response) {
  try {
    const contact = await contactService.getContactById(req.user!.userId, getParam(req, 'id'));
    if (!contact) { res.status(404).json({ error: 'Contact not found' }); return; }
    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createContact(req: Request, res: Response) {
  try {
    const { name, phone, priority, relation, consentGiven } = req.body;
    if (!name || !phone) { res.status(400).json({ error: 'Name and phone are required' }); return; }
    const contact = await contactService.createContact(req.user!.userId, { name, phone, priority, relation, consentGiven });
    await logEmergencyAction({ userId: req.user!.userId, action: 'CREATE_EMERGENCY_CONTACT', entity: 'EmergencyContact', entityId: contact.id, ipAddress: getIp(req) });
    res.status(201).json(contact);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function updateContact(req: Request, res: Response) {
  try {
    await contactService.updateContact(req.user!.userId, getParam(req, 'id'), req.body);
    await logEmergencyAction({ userId: req.user!.userId, action: 'UPDATE_EMERGENCY_CONTACT', entity: 'EmergencyContact', entityId: getParam(req, 'id'), ipAddress: getIp(req) });
    res.json({ message: 'Contact updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function deleteContact(req: Request, res: Response) {
  try {
    await contactService.deleteContact(req.user!.userId, getParam(req, 'id'));
    await logEmergencyAction({ userId: req.user!.userId, action: 'DELETE_EMERGENCY_CONTACT', entity: 'EmergencyContact', entityId: getParam(req, 'id'), ipAddress: getIp(req) });
    res.json({ message: 'Contact removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function reorderContacts(req: Request, res: Response) {
  try {
    const contacts = await contactService.reorderContacts(req.user!.userId, req.body.orderedIds);
    res.json(contacts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function sendTestAlert(req: Request, res: Response) {
  try {
    const result = await contactService.sendTestAlert(req.user!.userId, getParam(req, 'id'));
    await logEmergencyAction({ userId: req.user!.userId, action: 'TEST_ALERT', entity: 'EmergencyContact', entityId: getParam(req, 'id'), ipAddress: getIp(req) });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function sendTestAlertToAll(req: Request, res: Response) {
  try {
    const contacts = await contactService.getContacts(req.user!.userId);
    if (!contacts.length) { res.status(400).json({ error: 'No emergency contacts found' }); return; }

    const logs: { contactId: string; phone: string; success: boolean; error?: string }[] = [];
    for (const contact of contacts) {
      try {
        const result = await sendTestSMS(contact.phone);
        logs.push({ contactId: contact.id, phone: contact.phone, success: result.success, error: result.error });
      } catch (err: any) {
        logs.push({ contactId: contact.id, phone: contact.phone, success: false, error: err.message });
      }
    }

    await logEmergencyAction({ userId: req.user!.userId, action: 'TEST_ALERT_ALL', entity: 'EmergencyContact', entityId: 'all', ipAddress: getIp(req) });

    const allSucceeded = logs.every(l => l.success);
    res.json({ success: allSucceeded, results: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function triggerEmergencySos(req: Request, res: Response) {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) { res.status(400).json({ error: 'latitude and longitude are required' }); return; }

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } });
    const userName = user?.name || 'Someone';

    const event = await prisma.emergencyEvent.create({
      data: {
        userId: req.user!.userId,
        status: 'ACTIVE',
        latitude,
        longitude,
        locationName: req.body.locationName || '',
        description: req.body.description || '',
        contactMethod: 'SMS',
      },
    });

    const contacts = await contactService.getContacts(req.user!.userId);
    const deliveryLogs: { contactId: string; phone: string; name: string; success: boolean; error?: string }[] = [];

    for (const contact of contacts) {
      try {
        const result = await sendSosSMS(contact.phone, userName, latitude, longitude);

        await prisma.emergencyNotification.create({
          data: {
            eventId: event.id,
            contactId: contact.id,
            method: 'SMS',
            status: result.success ? 'SENT' : 'FAILED',
            message: `VitaNexa Emergency Alert – ${userName} needs help`,
            sentAt: result.success ? new Date() : undefined,
            error: result.error,
          },
        });

        deliveryLogs.push({ contactId: contact.id, phone: contact.phone, name: contact.name, success: result.success, error: result.error });
      } catch (err: any) {
        deliveryLogs.push({ contactId: contact.id, phone: contact.phone, name: contact.name, success: false, error: err.message });
      }
    }

    await logEmergencyAction({ userId: req.user!.userId, action: 'SOS_TRIGGER', entity: 'EmergencyEvent', entityId: event.id, ipAddress: getIp(req) });

    res.status(201).json({ eventId: event.id, status: 'ACTIVE', deliveries: deliveryLogs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function triggerSos(req: Request, res: Response) {
  try {
    const result = await emergencyService.triggerSos(req.user!.userId, getIp(req) || '0.0.0.0', req.body);
    if (result.event) {
      await logEmergencyAction({ userId: req.user!.userId, action: 'SOS_TRIGGER', entity: 'EmergencyEvent', entityId: result.event.id, ipAddress: getIp(req) });
    }
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function cancelSos(req: Request, res: Response) {
  try {
    const event = await emergencyService.cancelSos(req.user!.userId, getParam(req, 'id'));
    await logEmergencyAction({ userId: req.user!.userId, action: 'SOS_CANCEL', entity: 'EmergencyEvent', entityId: getParam(req, 'id'), ipAddress: getIp(req) });
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function resolveSos(req: Request, res: Response) {
  try {
    const event = await emergencyService.resolveSos(req.user!.userId, getParam(req, 'id'));
    await logEmergencyAction({ userId: req.user!.userId, action: 'SOS_RESOLVE', entity: 'EmergencyEvent', entityId: getParam(req, 'id'), ipAddress: getIp(req) });
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getEventStatus(req: Request, res: Response) {
  try {
    const event = await emergencyService.getEventStatus(req.user!.userId, getParam(req, 'id'));
    res.json(event);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}

export async function getActiveEvent(req: Request, res: Response) {
  try {
    const event = await emergencyService.getActiveEvent(req.user!.userId);
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEventHistory(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await emergencyService.getEventHistory(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getNearbyResources(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) { res.status(400).json({ error: 'lat and lng query params required' }); return; }
    const resources = await emergencyService.getNearbyResources(lat, lng);
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function searchHospitals(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string) || 5;
    if (isNaN(lat) || isNaN(lng)) { res.status(400).json({ error: 'lat and lng query params required' }); return; }
    const hospitals = await emergencyService.searchNearbyHospitals(lat, lng, radius);
    res.json(hospitals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getEmergencyStats(_req: Request, res: Response) {
  try {
    const stats = await emergencyService.getEmergencyStats(true);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await emergencyService.getAuditLogs(true, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getActiveEmergencies(_req: Request, res: Response) {
  try {
    const events = await emergencyService.getActiveEmergencies(true);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAllEvents(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.emergencyEvent.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, phone: true } }, notifications: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emergencyEvent.count({ where }),
    ]);
    res.json({ events, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
