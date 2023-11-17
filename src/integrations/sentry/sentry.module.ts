import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { ISentryConfig } from './dto';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { SentryService } from './sentry.service';
import { LoggerModule } from '../../common/logger/logger.module';
import { LoggerService } from '../../common/logger/logger.service';
import sentryConfig from '../../config/sentry.config';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forFeature(sentryConfig), PrismaModule, LoggerModule],
  providers: [
    SentryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
  exports: [SentryService],
})
export class SentryModule implements OnModuleInit {
  constructor(
    @Inject(sentryConfig.KEY)
    private readonly config: ISentryConfig,
    private readonly prismaService: PrismaService,
    private readonly adapterHost: HttpAdapterHost,
    private readonly loggerService: LoggerService,
  ) {}

  onModuleInit() {
    const { dsn, isProfilingEnabled, enabled, tracesSampleRate } = this.config;

    if (!enabled) return this.loggerService.warn('Sentry is disabled!');

    Sentry.init({
      dsn,
      tracesSampler() {
        return tracesSampleRate;
      },
      profilesSampleRate: isProfilingEnabled ? 1 : 0,
      integrations: this.buildIntegrations(),

      beforeSendTransaction(event) {
        if (event.transaction === 'POST /activity/details') {
          event.request.data = '{{WEBHOOK DATA WAS REMOVED}}';
        }

        return event;
      },
    });
  }

  private buildIntegrations() {
    const integrations = [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: this.adapterHost.httpAdapter.getInstance() }),
      new Sentry.Integrations.Prisma({ client: this.prismaService }),
    ];

    if (this.config.isProfilingEnabled) integrations.push(new ProfilingIntegration());

    return integrations;
  }
}
