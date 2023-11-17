import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';

@Controller('healthcheck')
export class HealthcheckController {
  @Get()
  @HealthCheck()
  check() {
    return {
      status: 'ok',
      info: {},
      error: {},
      details: {},
    };
  }
}
