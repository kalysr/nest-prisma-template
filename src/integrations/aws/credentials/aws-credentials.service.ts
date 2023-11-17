import { Injectable } from '@nestjs/common';
import { GetSecretsParams } from '../../../utils/aws/get-secret-value-params';
import { getSecretValue } from '../../../utils/aws/secrets-manager.util';

@Injectable()
export class AwsCredentialsService {
  getSecretValue<T = Record<string, any>>(params: GetSecretsParams) {
    return getSecretValue<T>(params);
  }
}
