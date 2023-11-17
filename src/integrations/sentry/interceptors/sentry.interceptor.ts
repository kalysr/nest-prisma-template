import { ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly handler = Sentry.Handlers.errorHandler();

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        const http = context.switchToHttp();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.handler(error, http.getRequest(), http.getResponse(), () => {});

        return throwError(() => error);
      }),
    );
  }
}
