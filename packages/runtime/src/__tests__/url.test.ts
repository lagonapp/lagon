import { describe, expect, it } from 'vitest';
import { URL } from '../runtime/URL';

describe('URL', () => {
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

    it('should return the host without port if scheme match', () => {
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
    it.todo('should return the origin', () => {
      expect(new URL('blob:https://mozilla.org:443/').origin).toEqual('https://mozilla.org');
    });
  });

  describe('password', () => {
    it.todo('should return the password', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/password').password,
      ).toEqual('flabada');
    });
  });

  describe('pathname', () => {
    it.todo('should return the pathname', () => {
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
    it.todo('should return the search', () => {
      expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/search?q=123').search).toEqual('?q=123');
    });
  });

  describe('searchParams', () => {
    it.todo('should return the searchParams', () => {
      // expect(new URL('https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol').searchParams).toEqual('https:');
    });
  });

  describe('username', () => {
    it.todo('should return the username', () => {
      expect(
        new URL('https://anonymous:flabada@developer.mozilla.org/en-US/docs/Web/API/URL/username').username,
      ).toEqual('anonymous');
    });
  });
});
