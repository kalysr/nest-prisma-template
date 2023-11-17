import { MessageAttributeValue, SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { IAwsConfig } from './interfaces/aws-config.interface';
import { LoggerService } from '../../common/logger/logger.service';
import awsConfig from '../../config/aws.config';
import { SentryService } from '../sentry/sentry.service';

@Injectable()
export class AwsSqsService {
  private readonly client: SQSClient;

  constructor(
    @Inject(awsConfig.KEY) config: IAwsConfig,
    private readonly sentryService: SentryService,
    private readonly loggerService: LoggerService,
  ) {
    this.client = new SQSClient(config);
  }

  sendMessage(params: SendMessageCommandInput) {
    const input = this.attachDefaultAttributes(params);
    this.loggerService.debug(`Sending SQS message ${params.MessageBody}`);
    return this.client.send(new SendMessageCommand(input));
  }

  // TODO: This can be implemented as a middleware for aws sdk
  private attachDefaultAttributes<T extends Pick<SendMessageCommandInput, 'MessageAttributes'>>(input: T): T {
    const tracingContext = this.sentryService.serializeTracingContext();

    return {
      ...input,
      MessageAttributes: {
        ...this.serialiseMessageAttributes(tracingContext),
        ...input.MessageAttributes,
      },
    };
  }

  private serialiseMessageAttributes(attributes: Record<string, string>): SendMessageCommandInput['MessageAttributes'] {
    return Object.fromEntries(
      Object.entries(attributes)
        .filter((entry) => !!entry[1])
        .map(([key, StringValue]) => [key, { DataType: 'String', StringValue } as MessageAttributeValue]),
    );
  }
}
