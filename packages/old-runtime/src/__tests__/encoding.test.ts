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

describe('encoding', () => {
  it('should encode', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const encoded = new TextEncoder().encode("Hello World")
  return new Response(encoded);
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]));

    clearCache(deployment);
  });

  it('should decode', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const decoded = new TextDecoder().decode(new Uint8Array([
      72,
      101,
      108,
      108,
      111,
      32,
      87,
      111,
      114,
      108,
      100,
    ]))
  return new Response(decoded);
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should encode and decode', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const encoded = new TextEncoder().encode("Hello World")
  const decoded = new TextDecoder().decode(encoded)
  return new Response(decoded);
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should have encoding field on TextEncoder', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const result = new TextEncoder().encoding
  return new Response(result);
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('utf-8');

    clearCache(deployment);
  });

  it('should have encoding field on TextDecoder', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  const result = new TextDecoder().encoding
  return new Response(result);
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('utf-8');

    clearCache(deployment);
  });
});
