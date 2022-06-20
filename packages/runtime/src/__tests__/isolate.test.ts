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
  it('should create an Isolate', async () => {
    const runIsolate = await getIsolate({
      deployment: {
        ...deployment,
        deploymentId: Math.random().toString(),
      },
      getDeploymentCode: async () => `export function handler(request) {
  return new Response('Hello World');
}`,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should throw if we import something', async () => {
    await expect(
      getIsolate({
        deployment: {
          ...deployment,
          deploymentId: Math.random().toString(),
        },
        getDeploymentCode: async () => `import test from 'test';
export function handler(request) {
  return new Response('Hello World');
}`,
      }),
    ).rejects.toThrow("Can't import module, you must bundle all your code in a single file.");

    clearCache(deployment);
  });

  it('should throw if handler function is not exported', async () => {
    await expect(
      getIsolate({
        deployment: {
          ...deployment,
          deploymentId: Math.random().toString(),
        },
        getDeploymentCode: async () => `function handler(request) {
  return new Response('Hello World');
}`,
      }),
    ).rejects.toThrow('Function did not export a handler function.');

    clearCache(deployment);
  });

  it('should throw if handler is not a function', async () => {
    await expect(
      getIsolate({
        deployment: {
          ...deployment,
          deploymentId: Math.random().toString(),
        },
        getDeploymentCode: async () => `export const handler = "test"`,
      }),
    ).rejects.toThrow('Function did not export a handler function.');

    clearCache(deployment);
  });

  // it('should stop when timeout elapsed', async () => {});

  // it('should throw when memory is full', async () => {});
});
