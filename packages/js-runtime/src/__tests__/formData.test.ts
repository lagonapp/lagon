import { describe, expect, it, vi } from 'vitest';
import '../';

describe('FormData', () => {
  it('should instanciate', () => {
    expect(new FormData()).toBeDefined();
  });

  it('should append', () => {
    const fields = new FormData();
    fields.append('a', 'b');
    fields.append('c', 'd');
    expect(fields.get('a')).toEqual('b');
    expect(fields.get('c')).toEqual('d');
  });

  it('should delete', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.delete('a');
    expect(fields.get('a')).toEqual(null);
  });

  it('should return entries', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(Array.from(fields.entries())).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('should call forEach', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    const callback = vi.fn();
    fields.forEach(callback);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('b', 'a', fields);
    expect(callback).toHaveBeenCalledWith('d', 'c', fields);
  });

  it('should get', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(fields.get('a')).toEqual('b');
    expect(fields.get('c')).toEqual('d');
    expect(fields.get('e')).toBeNull();
  });

  it('should getAll', () => {
    const fields = new FormData();
    fields.set('foo', '1');
    fields.set('bar', '2');
    fields.append('foo', '3');
    expect(fields.getAll('foo')).toEqual(['1', '3']);
  });

  it('should has', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(fields.has('a')).toBeTruthy();
    expect(fields.has('c')).toBeTruthy();
    expect(fields.has('e')).toBeFalsy();
  });

  it('should return keys', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(Array.from(fields.keys())).toEqual(['a', 'c']);
  });

  it('should set', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(fields.get('a')).toEqual('b');
    expect(fields.get('c')).toEqual('d');
  });

  it('should return values', () => {
    const fields = new FormData();
    fields.set('a', 'b');
    fields.set('c', 'd');
    expect(Array.from(fields.values())).toEqual(['b', 'd']);
  });

  describe('Parse', () => {
    it('should parse FormData', async () => {
      const fields = await new Response(
        `-----------------------------9051914041544843365972754266
Content-Disposition: form-data; name="hello"

world!
-----------------------------9051914041544843365972754266--`,
        {
          headers: {
            'content-type': 'multipart/form-data; boundary=---------------------------9051914041544843365972754266',
          },
        },
      ).formData();

      expect(fields.get('hello')).toEqual('world!');
    });

    it('should parse multiple fields', async () => {
      const fields = await new Response(
        `-----------------------------9051914041544843365972754266
Content-Disposition: form-data; name="hello"

world!
-----------------------------9051914041544843365972754266
Content-Disposition: form-data; name="description"

this is another field
-----------------------------9051914041544843365972754266--`,
        {
          headers: {
            'content-type': 'multipart/form-data; boundary=---------------------------9051914041544843365972754266',
          },
        },
      ).formData();

      expect(fields.get('hello')).toEqual('world!');
      expect(fields.get('description')).toEqual('this is another field');
    });

    it('should parse files', async () => {
      const fields = await new Response(
        `-----------------------------735323031399963166993862150
Content-Disposition: form-data; name="text1"

text default
-----------------------------735323031399963166993862150
Content-Disposition: form-data; name="file1"; filename="a.txt"
Content-Type: text/plain

Content of a.txt.

-----------------------------735323031399963166993862150
Content-Disposition: form-data; name="file2"; filename="a.html"
Content-Type: text/html

<!DOCTYPE html><title>Content of a.html.</title>

-----------------------------735323031399963166993862150
Content-Disposition: form-data; name="file3"; filename="binary"
Content-Type: application/octet-stream

aωb
-----------------------------735323031399963166993862150--`,
        {
          headers: {
            'content-type': 'multipart/form-data; boundary=---------------------------735323031399963166993862150',
          },
        },
      ).formData();

      expect(fields.get('text1')).toEqual('text default');
      expect(fields.get('file1')).toEqual('Content of a.txt.');
      expect(fields.get('file2')).toEqual('<!DOCTYPE html><title>Content of a.html.</title>');
    });
  });
});
