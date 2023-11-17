import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthcheckController } from './healthcheck/healthcheck.controller';

@Module({
  controllers: [HealthcheckController],
  imports: [TerminusModule],
})
export class ApiModule {}
