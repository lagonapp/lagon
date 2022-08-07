import { clearCache, Deployment, deploymentsCache } from '../deployments';
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
  it('should create an Isolate', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  return new Response('Hello World');
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should throw if we import something', async () => {
    const deployment = getDeployment();
    await expect(
      getIsolate({
        deployment,
        getDeploymentCode: async () => `import test from 'test';
export function handler(request) {
  return new Response('Hello World');
}`,
        onReceiveStream: () => null,
      }),
    ).rejects.toThrow("Can't import module, you must bundle all your code in a single file.");

    clearCache(deployment);
  });

  it('should throw if handler function is not exported', async () => {
    const deployment = getDeployment();
    await expect(
      getIsolate({
        deployment,
        getDeploymentCode: async () => `function handler(request) {
  return new Response('Hello World');
}`,
        onReceiveStream: () => null,
      }),
    ).rejects.toThrow('Function did not export a handler function.');

    clearCache(deployment);
  });

  it('should throw if handler is not a function', async () => {
    const deployment = getDeployment();
    await expect(
      getIsolate({
        deployment,
        getDeploymentCode: async () => `export const handler = "test"`,
        onReceiveStream: () => null,
      }),
    ).rejects.toThrow('Function did not export a handler function.');

    clearCache(deployment);
  });

  it('should cache and clear cache', async () => {
    const deployment = getDeployment();
    await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  return new Response('Hello World');
}`,
      onReceiveStream: () => null,
    });

    expect(deploymentsCache.get(deployment.deploymentId)).toBeDefined();
    clearCache(deployment);
    expect(deploymentsCache.get(deployment.deploymentId)).not.toBeDefined();
  });

  it('should throw when timeout elapsed', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  while (true) {}
  return new Response('Hello World');
}`,
      onReceiveStream: () => null,
    });

    await expect(runIsolate(request)).rejects.toThrow('Script execution timed out.');

    clearCache(deployment);
  });

  it('should throw when memory is full', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const storage = [];
  const twoMegabytes = 1024 * 1024 * 20;
  while (true) {
    const array = new Uint8Array(twoMegabytes);
    for (let ii = 0; ii < twoMegabytes; ii += 4096) {
      array[ii] = 1;
    }
    storage.push(array);
  }
  return new Response('Hello World');
}`,
      onReceiveStream: () => null,
    });

    await expect(runIsolate(request)).rejects.toThrow('Array buffer allocation failed');

    clearCache(deployment);
  });
});
