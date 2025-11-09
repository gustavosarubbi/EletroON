import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
      return next();
    }

    if (!(req as any).rawBody && typeof req.body === 'string') {
      (req as any).rawBody = Buffer.from(req.body, 'utf-8');
    } else if (!(req as any).rawBody && req.body && typeof req.body === 'object') {
      (req as any).rawBody = Buffer.from(JSON.stringify(req.body));
    }

    return next();
  }
}

