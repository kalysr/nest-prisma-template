import { getSecretValue } from '../utils/aws/secrets-manager.util';

/**
 * This script fetches secrets stored in the AWS secrets manager if
 * all required information is provided, otherwise does nothing.
 *
 * List of required env variables to run this script:
 * - AWS_REGION_NAME
 * - SECRET_ENVS
 * - AWS_ACCESS_KEY_ID_SECRET_ENVS
 * - AWS_SECRET_ACCESS_KEY_SECRET_ENVS
 *
 * If any of these env variables are empty or not present this script outputs nothing.
 *
 * Example usage:
 * export $(node ./dist/cli/printAwsSecrets | xargs -0); env
 *
 * TODO: In the future this script should be replaced with an automatic way to
 * inject env variables from AWS secrets manager via third party tools
 *  */
async function main() {
  const getEnvOrExit = (key: string) => {
    const value = process.env[key];

    if (!value) return process.exit(0);

    return value;
  };

  const configurationsToLoad = ['ENVS'].map((postfix) => {
    return {
      secretId: getEnvOrExit(`SECRET_${postfix}`),
      credentials: {
        accessKeyId: getEnvOrExit(`AWS_ACCESS_KEY_ID_SECRET_${postfix}`),
        secretAccessKey: getEnvOrExit(`AWS_SECRET_ACCESS_KEY_SECRET_${postfix}`),
      },
      region: getEnvOrExit('AWS_REGION_NAME'),
    };
  });

  const secrets = await Promise.all(configurationsToLoad.map(getSecretValue));

  const formattedSecrets = secrets
    .flatMap((secret) => Object.entries(secret))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  process.stdout.write(formattedSecrets);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
