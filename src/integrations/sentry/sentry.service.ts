import { Injectable } from '@nestjs/common';
import { getDynamicSamplingContextFromClient, hasTracingEnabled } from '@sentry/core';
import * as Sentry from '@sentry/node';
import { CustomSamplingContext, DynamicSamplingContext, TransactionContext } from '@sentry/types';
import {
  dynamicSamplingContextToSentryBaggageHeader,
  generateSentryTraceHeader,
  tracingContextFromHeaders,
} from '@sentry/utils';
import { TracingHeaders as TracingHeader } from './consts';
import { TracingContextDto } from './dto';

@Injectable()
export class SentryService {
  private sentryCaptureMessage(level: Sentry.SeverityLevel, message: string, data?: Record<string, unknown>) {
    try {
      Sentry.captureMessage(message, {
        extra: data,
        level,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  debug(message: string, data?: any) {
    this.sentryCaptureMessage('debug', message, data);
  }

  info(message: string, data?: any) {
    this.sentryCaptureMessage('info', message, data);
  }

  warn(message: string, data?: any) {
    this.sentryCaptureMessage('warning', message, data);
  }

  error(message: string, data?: any) {
    if (data instanceof Error)
      return Sentry.captureException(data, {
        extra: { message },
      });

    try {
      this.sentryCaptureMessage('error', message, data);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  serializeTracingContext(): Partial<Record<TracingHeader, string>> {
    const hub = Sentry.getCurrentHub();
    const client = hub.getClient();
    const scope = hub.getScope();

    // TODO: Should we wrap this into a separate span?
    const requestSpan = scope.getSpan();

    const { traceId, sampled, dsc } = scope.getPropagationContext();

    let sentryTraceHeader: string;
    let dynamicSamplingContext: Partial<DynamicSamplingContext>;

    if (requestSpan) {
      sentryTraceHeader = requestSpan.toTraceparent();
      dynamicSamplingContext = requestSpan?.transaction?.getDynamicSamplingContext();
    } else {
      sentryTraceHeader = generateSentryTraceHeader(traceId, undefined, sampled);
      dynamicSamplingContext =
        dsc || (client ? getDynamicSamplingContextFromClient(traceId, client, scope) : undefined);
    }

    const trace = { [TracingHeader.SENTRY_TRACE]: sentryTraceHeader };

    const sentryBaggage = dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);
    const sentryBaggageHeader = sentryBaggage && sentryBaggage.length > 0 ? sentryBaggage : undefined;

    if (!sentryBaggageHeader) return trace;

    trace[TracingHeader.SENTRY_BAGGAGE] = sentryBaggageHeader;

    return trace;
  }

  deserializeTracingContext(sentryTrace?: string, sentryBaggage?: string): TracingContextDto {
    return tracingContextFromHeaders(sentryTrace, sentryBaggage);
  }

  // TODO: Typing can be improved
  /**
   * Execute the operation inside of an execution context.
   * An entrypoint is any point of the application that can be
   * triggered by an outside event. For example, the following
   * things are considered to be entrypoints:
   * - Any incoming HTTP request
   * - Cron job
   * - Queue processor
   *
   * All errors thrown by the operation will be logged to Sentry and
   * passed through.
   *
   * @param operation - an operation to be executed as an entrypoint
   * @returns wrapped Promise
   */
  wrapEntrypoint<T = unknown>(operation: () => Promise<T>): Promise<T> {
    return Sentry.runWithAsyncContext(async () => {
      try {
        // It's important to await result here
        return await operation();
      } catch (err) {
        const hub = Sentry.getCurrentHub();
        const scope = hub.getScope();

        Sentry.captureException(err, scope);

        // The error should be passed trough
        throw err;
      }
    });
  }

  async withRootTransaction<T = unknown>(
    transactionCtx: TransactionContext,
    tracingCtx: TracingContextDto | null,
    samplingCtx: CustomSamplingContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    const hub = Sentry.getCurrentHub();

    const { propagationContext, traceparentData, dynamicSamplingContext } = tracingCtx || {};

    if (propagationContext) hub.getScope().setPropagationContext(propagationContext);

    if (!this.isTracingEnabled()) return operation();

    const transaction = Sentry.startTransaction(
      {
        ...transactionCtx,
        ...traceparentData,
        metadata: {
          dynamicSamplingContext: traceparentData && !dynamicSamplingContext ? {} : dynamicSamplingContext,
        },
      },
      samplingCtx,
    );

    // We put the transaction on the scope so users can attach children to it
    hub.configureScope((scope) => scope.setSpan(transaction));

    try {
      // It's important to await result here
      return await operation();
    } finally {
      // We don't need a catch block because the error should be passed to the entrypoint

      // TODO: Set correct http status
      // transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    }
  }

  private isTracingEnabled() {
    const hub = Sentry.getCurrentHub();
    const options = hub.getClient()?.getOptions();

    return hasTracingEnabled(options);
  }
}
