import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { qs } from '../utils/types';

const prisma = new PrismaClient();

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(qs(req.query.page)) || 1;
    const limit = parseInt(qs(req.query.limit)) || 20;
    const search = qs(req.query.search);
    const role = qs(req.query.role);
    const status = qs(req.query.status);
    const isActive = req.query.isActive;
    const sortBy = qs(req.query.sortBy) || 'createdAt';
    const sortOrder = qs(req.query.sortOrder) || 'desc';

    const allowedSortFields = ['createdAt', 'name', 'email', 'lastLogin', 'updatedAt', 'role', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    console.log('listUsers query:', JSON.stringify({ where, sortBy: safeSortBy, sortOrder: safeSortOrder, page, limit }));

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log('listUsers result:', users.length, 'users, total:', total);
    res.json({ data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }) },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'UPDATE_USER', entity: 'User', entityId: user.id, details: JSON.stringify(req.body), ipAddress: req.ip },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    await prisma.user.update({ where: { id: req.params.id as string }, data: { isActive: false, status: 'inactive' } });
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'DISABLE_USER', entity: 'User', entityId: req.params.id as string, ipAddress: req.ip },
    });
    res.json({ message: 'User disabled' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'ADMIN', 'MODERATOR', 'RESEARCHER', 'NUTRITIONIST', 'DOCTOR'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
      select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CHANGE_ROLE', entity: 'User', entityId: user.id, details: `Role changed to ${role}`, ipAddress: req.ip },
    });
    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { status, isActive: status === 'active' },
      select: { id: true, name: true, email: true, role: true, status: true, isActive: true, updatedAt: true },
    });
    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CHANGE_STATUS', entity: 'User', entityId: user.id, details: `Status changed to ${status}`, ipAddress: req.ip },
    });
    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



