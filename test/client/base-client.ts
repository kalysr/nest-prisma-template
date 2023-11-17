import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export abstract class BaseClient {
  protected request: () => request.SuperTest<request.Test>;
  constructor(protected readonly app: INestApplication) {
    this.request = () => request(this.app.getHttpServer());
  }
}
