import { Injectable, NestMiddleware } from '@nestjs/common';
import { json } from 'body-parser';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    json({ limit: '200mb' })(req, res, next);
  }
}
