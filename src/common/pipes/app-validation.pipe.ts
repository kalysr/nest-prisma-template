import { ValidationPipe, ArgumentMetadata, Injectable } from '@nestjs/common';
import { VALIDATION_OPTIONS_OVERRIDE_KEY } from '../decorators';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  async transform(value: any, metadata: ArgumentMetadata) {
    const options = Reflect.getMetadata(VALIDATION_OPTIONS_OVERRIDE_KEY, metadata.metatype);

    const originalOptions = { ...this.validatorOptions };

    this.validatorOptions = { ...this.validatorOptions, ...options };

    const result = super.transform(value, metadata);

    this.validatorOptions = originalOptions;

    return result;
  }
}
