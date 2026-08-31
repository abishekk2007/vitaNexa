import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logEmergencyAction(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (error) {
    console.error('[AuditLog] Failed to log emergency action:', error);
  }
}
