import { describe, expect, it, vi } from 'vitest';
import '../';

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
    expect(params.get('e')).toBeNull();
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

    it('should set the hash', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/href#Examples');
      url.hash = '#Examples2';
      expect(url.hash).toEqual('#Examples2');
      expect(url.href).toEqual('https://developer.mozilla.org/en-US/docs/Web/API/URL/href#Examples2');
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

    it('should set the host', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/host');
      url.host = 'developer.mozilla.org:4097';
      expect(url.host).toEqual('developer.mozilla.org:4097');
      expect(url.href).toEqual('https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host');
    });

    it('should update the host when setting the port', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/host');
      url.port = '4097';
      expect(url.host).toEqual('developer.mozilla.org:4097');
      expect(url.href).toEqual('https://developer.mozilla.org:4097/en-US/docs/Web/API/URL/host');
    });
  });

  describe('hostname', () => {
    it('should return the hostname', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname').hostname).toEqual(
        'developer.mozilla.org',
      );
    });

    it('should set the hostname', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname');
      url.hostname = 'developer.mozilla.org';
      expect(url.hostname).toEqual('developer.mozilla.org');
      expect(url.href).toEqual('https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname');
    });

    it('should update the hostname when setting the host', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/hostname');
      url.host = 'www.mozilla.org:4097';
      expect(url.hostname).toEqual('www.mozilla.org');
      expect(url.href).toEqual('https://www.mozilla.org:4097/en-US/docs/Web/API/URL/hostname');
    });
  });

  describe('href', () => {
    it('should return the href', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/href').href).toEqual(
        'https://developer.mozilla.org/en-US/docs/Web/API/URL/href',
      );
    });

    it('should set the href', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/href');
      url.href = 'https://developer.mozilla.org/en-US/docs/Web/API/URL';
      expect(url.href).toEqual('https://developer.mozilla.org/en-US/docs/Web/API/URL');
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

    it('should strip default port', () => {
      expect(new URL('https://mozilla.org:443/index.html?foo=bar&bar=foo#boo').port).toEqual('');
      expect(new URL('https://mozilla.org:443/index.html?foo=bar&bar=foo#boo').origin).toEqual('https://mozilla.org');
    });

    it('should include non-default port in origin', () => {
      expect(new URL('http://mozilla.org:1234/index.html?foo=bar&bar=foo#boo').origin).toEqual(
        'http://mozilla.org:1234',
      );
    });
  });

  describe('password', () => {
    it('should return the password', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password').password,
      ).toEqual('flabada');
    });

    it('should set the password', () => {
      const url = new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password');
      url.password = 'foo';
      expect(url.password).toEqual('foo');
      expect(url.href).toEqual('https://anonymous:foo@developer.mozilla.org/en-US/docs/Web/API/URL/password');
    });
  });

  describe('pathname', () => {
    it('should return the pathname', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname?q=value').pathname).toEqual(
        '/en-US/docs/Web/API/URL/pathname',
      );
    });

    it('should set the pathname', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname?q=value');
      url.pathname = '/en-US/docs/Web/API/URL';
      expect(url.pathname).toEqual('/en-US/docs/Web/API/URL');
      expect(url.href).toEqual('https://developer.mozilla.org/en-US/docs/Web/API/URL?q=value');
    });
  });

  describe('port', () => {
    it('should return the port', () => {
      expect(new URL('https://mydomain.com:80/svn/Repos/').port).toEqual('80');
    });

    it('should set the port', () => {
      const url = new URL('https://mydomain.com:80/svn/Repos/');
      url.port = '8080';
      expect(url.port).toEqual('8080');
      expect(url.href).toEqual('https://mydomain.com:8080/svn/Repos/');
    });
  });

  describe('protocol', () => {
    it('should return the protocol', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol').protocol).toEqual('https:');
    });

    it('should set the protocol', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol');
      url.protocol = 'http:';
      expect(url.protocol).toEqual('http:');
      expect(url.href).toEqual('http://developer.mozilla.org/en-US/docs/Web/API/URL/protocol');
    });
  });

  describe('search', () => {
    it('should return the search', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/search?q=123').search).toEqual('?q=123');
    });

    it('should set the search', () => {
      const url = new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/search?q=123');
      url.search = '?q=456';
      expect(url.search).toEqual('?q=456');
      expect(url.href).toEqual('https://developer.mozilla.org/en-US/docs/Web/API/URL/search?q=456');
    });
  });

  describe('searchParams', () => {
    it('should return the searchParams', () => {
      const { searchParams } = new URL('https://example.com/?name=Jonathan%20Smith&age=18');
      expect(searchParams?.get('name')).toEqual('Jonathan Smith');
      expect(searchParams?.get('age')).toEqual('18');
    });

    it('should set the searchParams', () => {
      const url = new URL('https://example.com/?name=Jonathan%20Smith&age=18');
      url.searchParams.set('name', 'John');
      expect(url.search).toEqual('?name=John&age=18');
      expect(url.href).toEqual('https://example.com/?name=John&age=18');
    });

    it('should update the searchParams when the search is updated', () => {
      const url = new URL('https://example.com/?name=Jonathan%20Smith&age=18');
      url.search = '?name=John';
      expect(url.searchParams.get('name')).toEqual('John');
      expect(url.href).toEqual('https://example.com/?name=John');
    });

    it('should return the same searchParams instance', () => {
      const url = new URL('https://example.com/?name=Jonathan%20Smith&age=18');
      const searchParams = url.searchParams;
      url.search = '?name=John';
      expect(url.searchParams).toBe(searchParams);
    });
  });

  describe('username', () => {
    it('should return the username', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/username').username,
      ).toEqual('anonymous');
    });

    it('should set the username', () => {
      const url = new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password');
      url.username = 'foo';
      expect(url.username).toEqual('foo');
      expect(url.href).toEqual('https://foo:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password');
    });
  });
});
