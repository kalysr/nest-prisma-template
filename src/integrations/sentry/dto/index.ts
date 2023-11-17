export * from './tracing-context.dto';

export interface ISentryConfig {
  dsn: string;
  enabled: boolean;
  isProfilingEnabled: boolean;
  tracesSampleRate: number;
}
