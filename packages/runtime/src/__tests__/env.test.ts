import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect } from 'vitest';
import { HandlerRequest } from '..';

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

describe('Isolate', () => {
  it('should inject env variables', async () => {
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
        env: { TEST_VAR: 'test' },
      },
      getDeploymentCode: async () => `export function handler(request) {
  return new Response(TEST_VAR);
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('test');

    clearCache(deployment);
  });

  it('should inject multiple env variables', async () => {
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
        env: { JOHN: 'John', JANE: 'Jane' },
      },
      getDeploymentCode: async () => `export function handler(request) {
  return new Response(JOHN + ' likes ' + JANE);
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('John likes Jane');

    clearCache(deployment);
  });

  it('should capitalize env variables', async () => {
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
        env: { hello: 'world' },
      },
      getDeploymentCode: async () => `export function handler(request) {
  return new Response(HELLO);
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('world');

    clearCache(deployment);
  });
});
