import { Request, Response, NextFunction } from 'express';

export function authorizeAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  console.log('authorizeAdmin - req.user:', JSON.stringify(req.user));
  if (req.user.role !== 'ADMIN') {
    console.log('authorizeAdmin - ROLE MISMATCH: expected ADMIN, got:', req.user.role);
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
