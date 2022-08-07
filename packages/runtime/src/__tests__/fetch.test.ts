import { clearCache, Deployment } from '../deployments';
import { getIsolate } from '../isolate';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HandlerRequest } from '..';
import { createServer } from 'node:http';
import { Headers } from '../runtime/fetch';

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

const server = createServer((request, response) => {
  if (request.url === '/json') {
    response.write(JSON.stringify({ hello: 'world' }));
    response.end();
    return;
  }

  if (request.url === '/body') {
    let body = '';

    request.on('data', chunk => {
      body += chunk;
    });

    request.on('end', () => {
      response.write(body);
      response.end();
    });

    return;
  }

  response.write('Hello World');
  response.end();
});

beforeAll(() => {
  server.listen(8000);
});

afterAll(() => {
  server.close();
});

describe('Headers', () => {
  describe('instanciate', () => {
    it('should instanciate without init', () => {
      expect(new Headers().toString()).toBeDefined();
    });

    it('should instanciate with init as object', () => {
      expect(new Headers({ 'Content-Type': 'image/jpeg', 'X-My-Custom-Header': 'Zeke are cool' })).toBeDefined();
    });

    it('should instanciate with init as array', () => {
      expect(
        new Headers([
          ['Set-Cookie', 'greeting=hello'],
          ['Set-Cookie', 'name=world'],
        ]),
      ).toBeDefined();
    });
  });

  it('should append', () => {
    const headers = new Headers();
    headers.append('a', 'b');
    headers.append('c', 'd');
    expect(headers.get('a')).toEqual('b');
    expect(headers.get('c')).toEqual('d');
  });

  it('should delete', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    headers.delete('a');
    expect(headers.get('a')).toBeUndefined();
  });

  it('should return entries', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    expect(Array.from(headers.entries())).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('should get', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    expect(headers.get('a')).toEqual('b');
    expect(headers.get('c')).toEqual('d');
    expect(headers.get('e')).toBeUndefined();
  });

  it('should has', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    expect(headers.has('a')).toBeTruthy();
    expect(headers.has('c')).toBeTruthy();
    expect(headers.has('e')).toBeFalsy();
  });

  it('should return keys', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    expect(Array.from(headers.keys())).toEqual(['a', 'c']);
  });

  describe('set', () => {
    it('should set without init', () => {
      const headers = new Headers();
      headers.set('a', 'b');
      headers.set('c', 'd');
      expect(headers.get('a')).toEqual('b');
      expect(headers.get('c')).toEqual('d');
    });

    it('should set with init', () => {
      const headers = new Headers({
        a: 'b',
        c: 'd',
      });
      headers.set('a', 'e');
      headers.set('c', 'f');
      expect(headers.get('a')).toEqual('e');
      expect(headers.get('c')).toEqual('f');
    });
  });

  it('should return values', () => {
    const headers = new Headers({
      a: 'b',
      c: 'd',
    });
    expect(Array.from(headers.values())).toEqual(['b', 'd']);
  });
});

describe('fetch', () => {
  it('should perform a get', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000');
  return new Response(await response.text());
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual('Hello World');

    clearCache(deployment);
  });

  it('should parse json', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000/json');
  return new Response(await response.json());
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual({ hello: 'world' });

    clearCache(deployment);
  });

  it('should post with body', async () => {
    const deployment = getDeployment();
    const runIsolate = await getIsolate({
      deployment,
      getDeploymentCode: async () => `export async function handler(request) {
  const response = await fetch('http://localhost:8000/body', {
    method: 'POST',
    body: JSON.stringify({ hello: 'world' }),
  });
  return new Response(await response.json());
}`,
      onReceiveStream: () => null,
    });

    const { response } = await runIsolate(request);

    expect(response.body).toEqual({ hello: 'world' });

    clearCache(deployment);
  });
});
