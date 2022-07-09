import { Deployment, fetch } from '@lagon/runtime';
import startServer from 'src/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as deploymentsConfig from 'src/deployments/config';
import * as deploymentsResult from 'src/deployments/result';
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

beforeAll(async () => {
  startServer(12345, 'localhost');

  // Wait for the server to start
  await new Promise(resolve => setTimeout(resolve, 500));
});

describe('Errors', () => {
  it('should throw an error if we import something', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`import test from 'test';
export function handler(request) {
  return new Response('Hello World');
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"Error: Can't import module, you must bundle all your code in a single file.\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error if handler function is not exported', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`function handler(request) {
  return new Response('Hello World');
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"Error: Function did not export a handler function.\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error if handler is not a function', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`export const handler = "test"');
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"SyntaxError: Invalid or unexpected token [function-isolate.js:1:30]\\\\n    at (<isolated-vm boundary>)\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error for SyntaxError', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`export function handler(request) {
  return new Response('missing quot);
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"SyntaxError: Invalid or unexpected token [function-isolate.js:2:23]\\\\n    at (<isolated-vm boundary>)\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error for ReferenceError', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`export function handler(request) {
  return new Response(missingVariable);
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"ReferenceError: missingVariable is not defined\\\\n    at handler (function-isolate.js:2:23)\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error when timeout is elapsed', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`export function handler(request) {
  while (true) {}
  return new Response('Hello World');
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"Error: Script execution timed out.\\\\n    at handler (function-isolate.js:2:3)\\\\n    at (<isolated-vm boundary>)\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });

  it('should throw an error when memory is full', async () => {
    const deployment = getDeployment();
    vi.spyOn(deploymentsConfig, 'getDeploymentFromRequest').mockReturnValue(deployment);
    vi.spyOn(deployments, 'getDeploymentCode').mockResolvedValue(`export async function handler(request) {
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
}`);
    let deploymentResult;
    vi.spyOn(deploymentsResult, 'addDeploymentResult').mockImplementationOnce(result => {
      deploymentResult = result.deploymentResult;
    });

    await fetch('http://localhost:12345/');

    expect(deploymentResult).toMatchInlineSnapshot(`
      {
        "cpuTime": 0n,
        "logs": [
          {
            "content": "\\"RangeError: Array buffer allocation failed\\\\n    at new ArrayBuffer (<anonymous>)\\\\n    at new Uint8Array (<anonymous>)\\\\n    at handler (function-isolate.js:5:19)\\"",
            "level": "error",
          },
        ],
        "receivedBytes": 34,
        "sentBytes": 0,
      }
    `);
    vi.restoreAllMocks();
  });
});
