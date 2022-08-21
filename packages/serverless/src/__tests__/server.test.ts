import { Deployment, fetch } from '@lagon/runtime';
import startServer from 'src/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as deploymentsConfig from 'src/deployments/utils';
import * as deployments from 'src/deployments';

const getDeployment = (): Deployment => ({
  functionId: 'functionId',
  functionName: 'functionName',
  deploymentId: Math.random().toString(),
  domains: [],
  memory: 128,
  timeout: 50,
  env: {},
  isCurrent: false,
  assets: [],
});

const request = async (code: string, init?: Parameters<typeof fetch>[1]): ReturnType<typeof fetch> => {
  const deployment = getDeployment();
  vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
  vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(code);

  const response = await fetch('http://localhost:12346/', init);
  if (response.options.headers && 'date' in response.options.headers) {
    delete response.options.headers.date;
  }

  return response;
};

beforeAll(async () => {
  startServer(12346, 'localhost');

  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe('Server', () => {
  it('should reply text', async () => {
    const response = await request(`export function handler(request) {
  return new Response('Hello World');
}`);

    expect(response).toMatchSnapshot();
  });

  it('should reply json', async () => {
    const response = await request(`export function handler(request) {
  return new Response(JSON.stringify({ hello: 'world' }), {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}`);

    expect(response).toMatchSnapshot();
  });

  it('should reply custom headers', async () => {
    const response = await request(`export function handler(request) {
  return new Response("Hello World", {
    headers: {
      'x-custom-header': 'custom-value',
    }
  });
}`);

    expect(response).toMatchSnapshot();
  });

  it('should reply custom status', async () => {
    const response = await request(`export function handler(request) {
  return new Response("Not Found", {
    status: 404,
    statusText: "Not Found",
  });
}`);

    expect(response).toMatchSnapshot();
  });

  it('should reply Uint8Array', async () => {
    const response = await request(`export function handler(request) {
  const body = new TextEncoder().encode('Hello World');
  return new Response(body);
}`);

    expect(response).toMatchSnapshot();
  });

  it('should handle json request', async () => {
    const response = await request(
      `export async function handler(request) {
  const body = await request.json();
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hello: 'world' }),
      },
    );

    expect(response).toMatchSnapshot();
  });
});
