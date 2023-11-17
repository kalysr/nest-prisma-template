import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppClient } from './app-client';

interface Middleware {
  execute?: (request: request.Test) => any;
  onError?: (request: request.Test, error: any) => any;
  setupSync?: (request: request.Test) => any;
}

function applyMiddleware(request: request.Test, middlewares: Middleware[]) {
  middlewares.forEach((middleware) => middleware.setupSync?.(request));

  const originalThen = request.then.bind(request);

  request.then = async (originalResolve, originalReject) => {
    const reject = (error: any) => {
      try {
        for (const middleware of middlewares) {
          middleware.onError?.(request, error);
        }
      } catch (middlewareError) {
        // TODO: Error chaining?
        error = middlewareError;
      }

      if (!originalReject) throw error;

      originalReject(error);
    };

    try {
      for (const middleware of middlewares) {
        await middleware.execute?.(request);
      }

      return await originalThen(originalResolve, reject);
    } catch (err) {
      reject(err);
    }
  };

  return request;
}

/**
 * Enriches error message from supertest to include the returned server error.
 */
class ApiErrorLoggerMiddleware implements Middleware {
  onError(request: request.Test, error: Error) {
    const responseText = (request as any)?.res?.text;

    if (!responseText) return;

    let parsedApiError = responseText;

    try {
      const message = JSON.parse(responseText).message;

      // We cannot really do much without a message
      if (!message) return;

      parsedApiError = JSON.stringify(message, null, 2);
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Cannot parse API error');
    }

    const oldStack = error.stack;

    // The error is most probably a response body expectation we should ignore it for now
    if (error.message.startsWith('expected {')) return;

    const newStack = [
      error.message,
      parsedApiError,
      // Skip error message itself
      oldStack.slice(oldStack.indexOf('\n')),
    ].join('\n');

    const newError = new Error();

    newError.stack = newStack;

    throw newError;
  }
}

class DefaultAssertMiddleware implements Middleware {
  private originalAsserts: any[];

  setupSync(request: any) {
    this.originalAsserts = [...request._asserts];

    request._asserts.splice(0, request._asserts.length);
  }

  execute(request: any) {
    // new expect statements were not added
    if (request._asserts.length === 0) {
      request._asserts.push(...this.originalAsserts);
    }
  }
}

function makeProxy<T extends object>(target: T, config: Record<string, unknown>, middlewares: Middleware[]) {
  return new Proxy(target, {
    get(target, p: string | symbol, receiver: any) {
      const executor = Reflect.get(target, p, receiver);

      if (typeof executor !== 'function' || p in config) return executor;

      return (...args) => {
        const request = executor.apply(target, args);

        return applyMiddleware(request, middlewares);
      };
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildApi<T extends object>(
  app: INestApplication,
  api: T,
): T & { as: (user: any) => T; withAccessToken: (token: string) => T } {
  // TODO: Implement proper middleware chaining
  const commonMiddleware = [new DefaultAssertMiddleware(), new ApiErrorLoggerMiddleware()];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const as = (user: any) => {
    return makeProxy(api, config, commonMiddleware);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const withAccessToken = (accessToken: string) => {
    return makeProxy(api, config, commonMiddleware);
  };

  const config = { as, withAccessToken };

  const client = Object.assign(api, config);

  return makeProxy(client, config, [...commonMiddleware]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildTestApi(app: INestApplication) {
  return {
    app: buildApi(app, new AppClient(app)),
  } as const;
}

export type TestingApi = ReturnType<typeof buildTestApi>;
