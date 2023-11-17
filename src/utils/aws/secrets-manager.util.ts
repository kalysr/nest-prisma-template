import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { GetSecretsParams } from './get-secret-value-params';

export async function getSecretValue<T = Record<string, any>>(params: GetSecretsParams): Promise<T> {
  const { secretId, credentials, region } = params;
  const client = new SecretsManagerClient({ credentials, region });

  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  return JSON.parse(response.SecretString) as T;
}
