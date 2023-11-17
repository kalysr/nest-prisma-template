import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.header('x-correlation-id') || uuid();
    req.headers['x-correlation-id'] = correlationId;
    res.set('X-Correlation-Id', correlationId);
    next();
  }
}
