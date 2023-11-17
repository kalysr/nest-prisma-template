export interface IAwsConfig {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  region: string;
}
