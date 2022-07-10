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

describe('eval', () => {
  it('should prevent eval usage from global', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  eval('console.log("escape")')
  return new Response('Hello World!');
}`,
    });

    await expect(runIsolate(request)).rejects.toThrow('eval is not a function');

    clearCache(deployment);
  });

  it('should prevent eval usage without eval keyword', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const evalName = ['e', 'v', 'a', 'l'].join('');
  global[evalName]('console.log("escape")')
  return new Response('Hello World!');
}`,
    });

    await expect(runIsolate(request)).rejects.toThrow('global[evalName] is not a function');

    clearCache(deployment);
  });
});

describe('Function', () => {
  it('should prevent Function usage from global', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const fn = new Function('console.log("escape")');
  fn();
  return new Response('Hello World!');
}`,
    });

    await expect(runIsolate(request)).rejects.toThrow('Function is not a function');

    clearCache(deployment);
  });

  it('should prevent Function usage without Function keyword', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const fnName = ['F', 'u', 'n', 'c', 't', 'i', 'o', 'n'].join('');
  const fn = new global[fnName]('console.log("escape")');
  fn();
  return new Response('Hello World!');
}`,
    });

    await expect(runIsolate(request)).rejects.toThrow('Function is not a function');

    clearCache(deployment);
  });
});
