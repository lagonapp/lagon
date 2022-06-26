import http from 'node:http';
import { Headers } from '../runtime/fetch';
import { RequestInit } from '../runtime/Request';
import { ResponseInit } from '../runtime/Response';

export type FetchResult = {
  body: string;
  options: ResponseInit;
};

export async function fetch(resource: string, init?: RequestInit): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    let headers: Record<string, string> = {};

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        for (const [key, value] of init.headers.entries()) {
          headers[key] = value;
        }
      } else {
        headers = init.headers;
      }
    }

    const request = http.request(
      resource,
      {
        method: init?.method || 'GET',
        headers,
      },
      response => {
        let body = '';

        response.on('data', chunk => {
          body += chunk;
        });

        response.on('end', () => {
          const headers: Record<string, string> = {};

          Object.entries(response.headers).forEach(([key, value]) => {
            if (value && !Array.isArray(value)) {
              headers[key] = value;
            }
          });

          resolve({
            body,
            options: {
              status: response.statusCode,
              statusText: response.statusMessage,
              headers,
              url: response.url,
            },
          });
        });
      },
    );

    if (init?.body) {
      request.write(init.body);
    }

    request.on('error', reject);
    request.end();
  });
}
