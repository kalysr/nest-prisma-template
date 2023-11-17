import { SetMetadata, ValidationPipeOptions } from '@nestjs/common';

export const VALIDATION_OPTIONS_OVERRIDE_KEY = 'validation_options_override_key';

export function ValidationOptions(options: ValidationPipeOptions) {
  return SetMetadata(VALIDATION_OPTIONS_OVERRIDE_KEY, options);
}
