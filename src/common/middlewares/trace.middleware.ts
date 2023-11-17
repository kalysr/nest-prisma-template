import { Injectable, NestMiddleware } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  private readonly handler = Sentry.Handlers.tracingHandler();

  use(req: Request, res: Response, next: NextFunction): void {
    // Our application uses "sentry-trace" & "sentry-baggage" header names to communicate a tracing context.
    // This is a little bit different to the default implementation of the tracingHandler.
    // Sentry.Handlers.tracingHandler uses "sentry-trace" & "baggage" headers to communicate this
    // info. To make the middleware work and skip writing a custom one we simply copy the value of
    // "sentry-baggage" header to the "baggage" header.
    req.headers['baggage'] ||= req.headers['sentry-baggage'];

    this.handler(req, res, next);
  }
}
