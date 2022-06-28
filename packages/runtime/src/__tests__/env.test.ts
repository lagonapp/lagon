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

describe('Isolate', () => {
  it('should inject env variables', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
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
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
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
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
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
