import { ConfigModuleOptions } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Config } from './config';

export const validateConfig: ConfigModuleOptions['validate'] = (config) => {
  const configuration = plainToInstance(Config, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(configuration, {
    whitelist: true,
  });

  if (errors && errors.length > 0) {
    throw new Error(`Configuration invalid\n${errors.toString()}`);
  }

  return configuration;
};
