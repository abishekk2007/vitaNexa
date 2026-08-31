import { Request, Response, NextFunction } from 'express';

export function auditLog(entity: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      const duration = Date.now() - start;
      console.log(
        `[AUDIT] ${entity} | ${req.method} ${req.originalUrl} | user:${req.user?.userId || 'anon'} | ${res.statusCode} | ${duration}ms`
      );
      return originalJson(body);
    };

    next();
  };
}
