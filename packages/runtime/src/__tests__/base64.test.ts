import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect } from 'vitest';
import { HandlerRequest } from '..';

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

const request: HandlerRequest = {
  input: 'http://localhost',
  options: {
    method: 'GET',
    headers: {},
  },
};

describe('base64', () => {
  it('should encode with atob', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const result = atob("Hello World")
  return new Response(result);
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('\x1Dée¡j+\x95');

    clearCache(deployment);
  });

  it('should decode with btoa', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const encoded = atob("Hello World")
  const result = btoa(encoded)
  return new Response(result);
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('HelloWorlQ==');

    clearCache(deployment);
  });
});
