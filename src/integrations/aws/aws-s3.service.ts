import { CompleteMultipartUploadCommandOutput, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import { IAwsConfig } from './interfaces/aws-config.interface';
import awsConfig from '../../config/aws.config';

@Injectable()
export class AwsS3Service {
  private client: S3Client;

  constructor(@Inject(awsConfig.KEY) config: IAwsConfig) {
    this.client = new S3Client(config);
  }

  upload(params: PutObjectCommandInput): Promise<CompleteMultipartUploadCommandOutput> {
    return new Upload({ client: this.client, params }).done();
  }
}
