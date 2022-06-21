import { RequestInit } from './Request';
import { Response } from './Response';

export async function fetch(resource: string, init: RequestInit) {
  // @ts-expect-error $0 is not defined
  const result = await $0.apply(undefined, [resource, init], {
    result: { promise: true, copy: true },
    arguments: { copy: true },
  });

  return new Response(result.body, result.options);
}

global.fetch = fetch;
