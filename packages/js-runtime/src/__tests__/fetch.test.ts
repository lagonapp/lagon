import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { fetch, Headers } from '../runtime/fetch';
import { Response } from '../runtime/Response';
import '../runtime/core';

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
      const headers = new Headers();
      expect(Array.from(headers.entries())).toEqual([]);
    });

    it('should instanciate with init as object', () => {
      const headers = new Headers({ 'Content-Type': 'image/jpeg', 'X-My-Custom-Header': 'Zeke are cool' });
      expect(Array.from(headers.entries())).toEqual([
        ['content-type', 'image/jpeg'],
        ['x-my-custom-header', 'Zeke are cool'],
      ]);
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
    headers.append('C', 'd');
    expect(headers.get('a')).toEqual('b');
    expect(headers.get('c')).toEqual('d');
  });

  it('should delete', () => {
    const headers = new Headers({
      A: 'b',
      c: 'd',
    });
    headers.delete('a');
    expect(headers.get('A')).toBeUndefined();
  });

  it('should return entries', () => {
    const headers = new Headers({
      a: 'b',
      C: 'd',
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
      C: 'd',
    });
    expect(headers.has('a')).toBeTruthy();
    expect(headers.has('c')).toBeTruthy();
    expect(headers.has('e')).toBeFalsy();
  });

  it('should return keys', () => {
    const headers = new Headers({
      a: 'b',
      C: 'd',
    });
    expect(Array.from(headers.keys())).toEqual(['a', 'c']);
  });

  describe('set', () => {
    it('should set without init', () => {
      const headers = new Headers();
      headers.set('a', 'b');
      headers.set('C', 'd');
      expect(headers.get('a')).toEqual('b');
      expect(headers.get('c')).toEqual('d');
    });

    it('should set with init', () => {
      const headers = new Headers({
        a: 'b',
        C: 'd',
      });
      headers.set('a', 'e');
      headers.set('B', 'f');
      headers.set('c', 'g');
      expect(headers.get('a')).toEqual('e');
      expect(headers.get('b')).toEqual('f');
      expect(headers.get('C')).toEqual('g');
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
  beforeEach(() => {
    globalThis.Lagon = {
      ...globalThis.Lagon,
      fetch: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call Lagon.fetch', async () => {
    // @ts-expect-error Lagon is not defined
    globalThis.Lagon.fetch.mockReturnValueOnce({
      body: 'Hello',
      status: 200,
    });

    const response = await fetch('https://google.com');

    expect(response).toEqual(new Response('Hello'));
    expect(globalThis.Lagon.fetch).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://google.com',
    });
  });

  it('should call Lagon.fetch with options', async () => {
    // @ts-expect-error Lagon is not defined
    globalThis.Lagon.fetch.mockReturnValueOnce({
      body: 'Hello',
      status: 200,
    });

    const response = await fetch('https://google.com', {
      method: 'POST',
      body: 'A body',
    });

    expect(response).toEqual(new Response('Hello'));
    expect(globalThis.Lagon.fetch).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://google.com',
      body: 'A body',
    });
  });
});

describe('Response', () => {
  it('should instanciate without arguments', async () => {
    const response = new Response();
    expect(await response.text()).toEqual('');
  });

  it('should instanciate with text body', () => {
    const response = new Response('Hello');
    expect(response).toBeDefined();
  });

  it('should instanciate with init', async () => {
    const response = new Response('Hello', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    expect(response).toBeDefined();
    expect(response.status).toEqual(404);
    expect(response.headers.get('Content-Type')).toEqual('text/plain');
    expect(await response.text()).toEqual('Hello');
  });
});
