export interface GetSecretsParams {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  region: string;
  secretId: string;
}
