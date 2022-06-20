import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HandlerRequest } from '..';
import { createServer } from 'node:http';

const deployment: Deployment = {
  functionId: 'functionId',
  functionName: 'functionName',
  deploymentId: 'deploymentId',
  domains: [],
  memory: 128,
  timeout: 50,
  env: {},
  isCurrent: false,
};

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
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
      },
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
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
      },
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000/json');
  return new Response(await response.json());
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual({ hello: 'world' });

    clearCache(deployment);
  });
});
