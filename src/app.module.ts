import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { JsonBodyMiddleware } from './common/middlewares/json-body.middleware';
import { RequestMiddleware } from './common/middlewares/request.middleware';
import { TraceMiddleware } from './common/middlewares/trace.middleware';
import { WithRequestContextMiddleware } from './common/middlewares/with-request-context.middeleware';
import { validateConfig } from './config/validate-config';
import { SentryModule } from './integrations/sentry/sentry.module';

@Module({
  imports: [ApiModule, ConfigModule.forRoot({ validate: validateConfig }), SentryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*').apply(WithRequestContextMiddleware).forRoutes('*');

    if (this.configService.get('sentry.enabled'))
      consumer.apply(TraceMiddleware).forRoutes('*').apply(RequestMiddleware).forRoutes('*');

    consumer.apply(JsonBodyMiddleware).forRoutes('*');
  }
}
