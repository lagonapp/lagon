import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect, vi } from 'vitest';
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

describe('Logs', () => {
  it('should receive logs', async () => {
    const onDeploymentLog = vi.fn();
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  console.log('Hello World');
  return new Response('');
}`,
      onReceiveStream: () => null,
      onDeploymentLog,
    });

    await runIsolate(request);

    expect(onDeploymentLog).toHaveBeenCalledWith({
      deploymentId: deployment.deploymentId,
      log: {
        content: '"Hello World"',
        level: 'log',
      },
    });

    clearCache(deployment);
  });

  it('should log objects', async () => {
    const onDeploymentLog = vi.fn();
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  console.log({ hello: 'world' });
  return new Response('');
}`,
      onReceiveStream: () => null,
      onDeploymentLog,
    });

    await runIsolate(request);

    expect(onDeploymentLog).toHaveBeenCalledWith({
      deploymentId: deployment.deploymentId,
      log: {
        content: '{"hello":"world"}',
        level: 'log',
      },
    });

    clearCache(deployment);
  });

  it('should log arrays', async () => {
    const onDeploymentLog = vi.fn();
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  console.log(['hello', 'world', 3]);
  return new Response('');
}`,
      onReceiveStream: () => null,
      onDeploymentLog,
    });

    await runIsolate(request);

    expect(onDeploymentLog).toHaveBeenCalledWith({
      deploymentId: deployment.deploymentId,
      log: {
        content: '["hello","world",3]',
        level: 'log',
      },
    });

    clearCache(deployment);
  });

  it('should receive all logs type', async () => {
    const onDeploymentLog = vi.fn();
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export function handler(request) {
  console.info('Info log');
  console.warn('Warn log');
  console.error('Error log');
  console.debug('Debug log');
  return new Response('');
}`,
      onReceiveStream: () => null,
      onDeploymentLog,
    });

    await runIsolate(request);

    expect(onDeploymentLog).toHaveBeenNthCalledWith(1, {
      deploymentId: deployment.deploymentId,
      log: {
        content: '"Info log"',
        level: 'info',
      },
    });

    expect(onDeploymentLog).toHaveBeenNthCalledWith(2, {
      deploymentId: deployment.deploymentId,
      log: {
        content: '"Warn log"',
        level: 'warn',
      },
    });

    expect(onDeploymentLog).toHaveBeenNthCalledWith(3, {
      deploymentId: deployment.deploymentId,
      log: {
        content: '"Error log"',
        level: 'error',
      },
    });

    // expect(onDeploymentLog).toHaveBeenNthCalledWith(4, {
    //   deploymentId: deployment.deploymentId,
    //   log: {
    //     content: '"Debug log"',
    //     level: 'debug',
    //   },
    // });

    clearCache(deployment);
  });
});
