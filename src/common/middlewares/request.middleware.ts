import { Injectable, NestMiddleware } from '@nestjs/common';
import { Handlers, runWithAsyncContext } from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  private readonly handler = Handlers.requestHandler({
    include: {
      ip: true,
      user: true,
      request: true,
      transaction: 'methodPath',
    },
  });

  use(req: Request, res: Response, next: NextFunction): void {
    runWithAsyncContext(
      () => {
        this.handler(req, res, next);
      },
      {
        // we should have async storage available from WithRequestContextMiddleware
        reuseExisting: true,
      },
    );
  }
}
