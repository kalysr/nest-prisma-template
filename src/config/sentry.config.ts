import { registerAs } from '@nestjs/config';
import { ISentryConfig } from '../integrations/sentry/dto';

export default registerAs<ISentryConfig>('sentry', () => {
  return {
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.SENTRY_DISABLED !== 'yes',
    isProfilingEnabled: process.env.SENTRY_PROFILING_DISABLED !== 'yes',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.2),
  };
});
