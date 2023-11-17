import { extractTraceparentData } from '@sentry/node';
import { PropagationContext } from '@sentry/types';
import { baggageHeaderToDynamicSamplingContext } from '@sentry/utils';

export interface TracingContextDto {
  dynamicSamplingContext: ReturnType<typeof baggageHeaderToDynamicSamplingContext>;
  propagationContext: PropagationContext;
  traceparentData: ReturnType<typeof extractTraceparentData>;
}
