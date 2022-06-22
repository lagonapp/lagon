import { describe, expect, it, vi } from 'vitest';
import { URL, URLSearchParams } from '../runtime/URL';

describe('URLSearchParams', () => {
  describe('instanciate', () => {
    it('should instanciate without init', () => {
      expect(new URLSearchParams().toString()).toEqual('');
    });

    it('should instanciate with init as string', () => {
      expect(new URLSearchParams('a=b&c=d').toString()).toEqual('a=b&c=d');
    });

    it('should instanciate with init as string with ?', () => {
      expect(new URLSearchParams('?a=b&c=d').toString()).toEqual('a=b&c=d');
    });

    it('should instanciate with init as object', () => {
      expect(new URLSearchParams({ a: 'b', c: 'd' }).toString()).toEqual('a=b&c=d');
    });

    it('should instanciate with init as array', () => {
      expect(
        new URLSearchParams([
          ['a', 'b'],
          ['c', 'd'],
        ]).toString(),
      ).toEqual('a=b&c=d');
    });
  });

  it('should append', () => {
    const params = new URLSearchParams();
    params.append('a', 'b');
    params.append('c', 'd');
    expect(params.toString()).toEqual('a=b&c=d');
  });

  it('should delete', () => {
    const params = new URLSearchParams('a=b&c=d');
    params.delete('a');
    expect(params.toString()).toEqual('c=d');
  });

  it('should return entries', () => {
    const params = new URLSearchParams('a=b&c=d');
    expect(Array.from(params.entries())).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('should call forEach', () => {
    const params = new URLSearchParams('a=b&c=d');
    const callback = vi.fn();
    params.forEach(callback);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('b', 'a', params);
    expect(callback).toHaveBeenCalledWith('d', 'c', params);
  });

  it('should get', () => {
    const params = new URLSearchParams('a=b&c=d');
    expect(params.get('a')).toEqual('b');
    expect(params.get('c')).toEqual('d');
    expect(params.get('e')).toBeUndefined();
  });

  it('should getAll', () => {
    const params = new URLSearchParams('foo=1&bar=2');
    params.append('foo', '3');
    expect(params.getAll('foo')).toEqual(['1', '3']);
  });

  it('should has', () => {
    const params = new URLSearchParams('a=b&c=d');
    expect(params.has('a')).toBeTruthy();
    expect(params.has('c')).toBeTruthy();
    expect(params.has('e')).toBeFalsy();
  });

  it('should return keys', () => {
    const params = new URLSearchParams('a=b&c=d');
    expect(Array.from(params.keys())).toEqual(['a', 'c']);
  });

  describe('set', () => {
    it('should set without init', () => {
      const params = new URLSearchParams();
      params.set('a', 'b');
      params.set('c', 'd');
      expect(params.toString()).toEqual('a=b&c=d');
    });

    it('should set with init', () => {
      const params = new URLSearchParams('a=b&c=d');
      params.set('a', 'e');
      params.set('c', 'f');
      expect(params.toString()).toEqual('a=e&c=f');
    });
  });

  it('should sort', () => {
    const params = new URLSearchParams('c=d&a=b');
    params.sort();
    expect(params.toString()).toEqual('a=b&c=d');
  });

  it('should return values', () => {
    const params = new URLSearchParams('a=b&c=d');
    expect(Array.from(params.values())).toEqual(['b', 'd']);
  });
});

describe('URL', () => {
  describe('base url', () => {
    it('should work with base url single slash', () => {
      expect(new URL('/', 'https://developer.mozilla.org').toString()).toEqual('https://developer.mozilla.org/');
    });

    it('should work with base url path without slash', () => {
      expect(new URL('en-US/docs', 'https://developer.mozilla.org').toString()).toEqual(
        'https://developer.mozilla.org/en-US/docs',
      );
    });

    it('should work with base url path with slash', () => {
      expect(new URL('/en-US/docs', 'https://developer.mozilla.org').toString()).toEqual(
        'https://developer.mozilla.org/en-US/docs',
      );
    });
  });

  describe('hash', () => {
    it('should return the hash', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/href#Examples').hash).toEqual('#Examples');
    });
  });

  describe('host', () => {
    it('should return the host', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/host').host).toEqual(
        'developer.mozilla.org',
      );
    });

    it.todo('should return the host without port if scheme match', () => {
      expect(new URL('https://developer.mozilla.org:443/en-US/docs/Web/API/URL/host').host).toEqual(
        'developer.mozilla.org',
      );
    });

    it("should return the host with port if scheme doesn't match", () => {
      expect(new URL('https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host').host).toEqual(
        'developer.mozilla.org:4097',
      );
    });
  });

  describe('hostname', () => {
    it('should return the hostname', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname').hostname).toEqual(
        'developer.mozilla.org',
      );
    });
  });

  describe('href', () => {
    it('should return the href', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/href').href).toEqual(
        'https://developer.mozilla.org/en-US/docs/Web/API/URL/href',
      );
    });
  });

  describe('origin', () => {
    it('should return the origin for https', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/origin').origin).toEqual(
        'https://developer.mozilla.org',
      );
    });

    it('should return the origin for http', () => {
      expect(new URL('http://developer.mozilla.org/en-US/docs/Web/API/URL/origin').origin).toEqual(
        'http://developer.mozilla.org',
      );
    });

    it('should return the origin for file', () => {
      expect(new URL('file:https://mozilla.org:443/').origin).toEqual('https://mozilla.org');
    });

    it('should return the origin for blob', () => {
      expect(new URL('blob:https://mozilla.org:443/').origin).toEqual('https://mozilla.org');
    });
  });

  describe('password', () => {
    it('should return the password', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password').password,
      ).toEqual('flabada');
    });
  });

  describe('pathname', () => {
    it('should return the pathname', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname?q=value').pathname).toEqual(
        '/en-US/docs/Web/API/URL/pathname',
      );
    });
  });

  describe('port', () => {
    it('should return the port', () => {
      expect(new URL('https://mydomain.com:80/svn/Repos/').port).toEqual('80');
    });
  });

  describe('protocol', () => {
    it('should return the protocol', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol').protocol).toEqual('https:');
    });
  });

  describe('search', () => {
    it('should return the search', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/search?q=123').search).toEqual('?q=123');
    });
  });

  describe('searchParams', () => {
    it('should return the searchParams', () => {
      const { searchParams } = new URL('https://example.com/?name=Jonathan%20Smith&age=18');
      expect(searchParams?.get('name')).toEqual('Jonathan%20Smith');
      expect(searchParams?.get('age')).toEqual('18');
    });
  });

  describe('username', () => {
    it('should return the username', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/username').username,
      ).toEqual('anonymous');
    });
  });
});
