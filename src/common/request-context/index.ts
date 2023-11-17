/**
 * ✨ Black magic ✨
 *
 * For more information please refer:
 * https://blog.haroldadmin.com/posts/asynclocalstorage-logs-nestjs
 *  */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId?: string;
}

const store = new AsyncLocalStorage<RequestContext>();

export const getRequestContext = (): RequestContext | undefined => {
  return store.getStore();
};

// Allows wrapping a request in a context
export const runWithContext = (operation: (ctx: RequestContext) => Promise<unknown>, context: RequestContext = {}) => {
  store.run(context, () => {
    return operation(getRequestContext());
  });
};
