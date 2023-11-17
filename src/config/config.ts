import { IsNumberString, IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { Environments } from '../common/enums/environments';

export class Config {
  @IsNumberString()
  PORT: string;

  @IsEnum(Environments)
  ENV: Environments;

  @IsString()
  AWS_REGION_NAME: string;

  @IsString()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  @IsEnum(['yes', 'no'])
  SENTRY_DISABLED: 'yes' | 'no';

  @IsString()
  SENTRY_DSN: string;

  @IsString()
  SENTRY_ENVIRONMENT: string;

  @IsString()
  @IsOptional()
  @IsEnum(['yes', 'no'])
  SENTRY_PROFILING_DISABLED: 'yes' | 'no';

  @IsNumber()
  @IsOptional()
  SENTRY_TRACES_SAMPLE_RATE: string;
}
