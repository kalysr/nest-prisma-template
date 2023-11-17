import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsS3Service } from './aws-s3.service';
import { AwsSqsService } from './aws-sqs.service';
import { LoggerModule } from '../../common/logger/logger.module';
import awsConfig from '../../config/aws.config';
import { SentryModule } from '../sentry/sentry.module';

@Module({
  imports: [ConfigModule.forFeature(awsConfig), SentryModule, LoggerModule],
  providers: [AwsSqsService, AwsS3Service],
  exports: [AwsSqsService, AwsS3Service],
})
export class AwsModule {}
