import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getRequestContext, runWithContext } from '../request-context';

@Injectable()
export class WithRequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    runWithContext(async () => {
      const context = getRequestContext();
      context.correlationId = req.headers['x-correlation-id'] as string;
      return next();
    }, {});
  }
}
