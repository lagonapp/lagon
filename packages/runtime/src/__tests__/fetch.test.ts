import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HandlerRequest } from '..';
import { createServer } from 'node:http';

const getDeployment = (): Deployment => ({
  functionId: 'functionId',
  functionName: 'functionName',
  deploymentId: Math.random().toString(),
  domains: [],
  memory: 128,
  timeout: 50,
  env: {},
  isCurrent: false,
});

const request: HandlerRequest = {
  input: 'http://localhost',
  options: {
    method: 'GET',
    headers: {},
  },
};

const server = createServer((request, response) => {
  if (request.url === '/json') {
    response.write(JSON.stringify({ hello: 'world' }));
    response.end();
    return;
  }

  if (request.url === '/body') {
    let body = '';

    request.on('data', chunk => {
      body += chunk;
    });

    request.on('end', () => {
      response.write(body);
      response.end();
    });

    return;
  }

  response.write('Hello World');
  response.end();
});

beforeAll(() => {
  server.listen(8000);
});

afterAll(() => {
  server.close();
});

describe('fetch', () => {
  it('should perform a get', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000');
  return new Response(await response.text());
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should parse json', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000/json');
  return new Response(await response.json());
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual({ hello: 'world' });

    clearCache(deployment);
  });

  it('should post with body', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000/body', {
    method: 'POST',
    body: JSON.stringify({ hello: 'world' }),
  });
  return new Response(await response.json());
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual({ hello: 'world' });

    clearCache(deployment);
  });
});
