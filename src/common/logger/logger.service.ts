import { Injectable, ConsoleLogger, Scope, LogLevel, Inject } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { getRequestContext } from '../request-context';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(@Inject(INQUIRER) private readonly parentClass?: object) {
    super();
    this.setContext(this.parentClass?.constructor?.name);
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
  ): string {
    const context = getRequestContext();

    const correlationId = context?.correlationId || '';

    formattedLogLevel = this.colorize(formattedLogLevel, logLevel);

    const output = this.stringifyMessage(message, logLevel);

    return `${correlationId} ${formattedLogLevel} ${contextMessage}${output}\n`;
  }
}
