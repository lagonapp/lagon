import http from 'node:http';
import { RequestInit } from '../runtime/Request';
import { ResponseInit } from '../runtime/Response';

export type FetchResult = {
  body: string;
  options: ResponseInit;
};

export async function fetch(resource: string, init?: RequestInit): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      resource,
      {
        method: init?.method || 'GET',
        headers: init?.headers || {},
      },
      response => {
        let body = '';

        response.on('data', chunk => {
          body += chunk;
        });

        response.on('end', () => {
          resolve({
            body,
            options: {
              status: response.statusCode,
              statusText: response.statusMessage,
              headers: response.headers,
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
