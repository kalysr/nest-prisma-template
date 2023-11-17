import { registerAs } from '@nestjs/config';
import { IAwsConfig } from '../integrations/aws/interfaces/aws-config.interface';

export default registerAs<IAwsConfig>('aws', (): IAwsConfig => {
  return {
    region: process.env.AWS_REGION_NAME,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
});
