import { describe, it, expect } from 'vitest';
import '../';

describe('File', () => {
  it('should be an instanceof Blob', () => {
    const file = new File([], 'file.txt');
    expect(file).toBeInstanceOf(Blob);
  });

  it('should allow empty files', () => {
    const file = new File([], 'file.txt');
    expect(file.size).toEqual(0);
    expect(file.type).toEqual('');
    expect(file.name).toEqual('file.txt');
    expect(file.lastModified).toBeGreaterThan(0);
  });

  it('should set the type', () => {
    const file = new File([], 'file.txt', { type: 'text/plain' });
    expect(file.size).toEqual(0);
    expect(file.type).toEqual('text/plain');
    expect(file.name).toEqual('file.txt');
    expect(file.lastModified).toBeGreaterThan(0);
  });

  it('should init with string', () => {
    const file = new File(['hello'], 'file.txt', { type: 'text/plain' });
    expect(file.size).toEqual(5);
    expect(file.type).toEqual('text/plain');
    expect(file.name).toEqual('file.txt');
    expect(file.lastModified).toBeGreaterThan(0);
  });

  it('should set lastModified', () => {
    const file = new File([], 'file.txt', { lastModified: 123 });
    expect(file.size).toEqual(0);
    expect(file.type).toEqual('');
    expect(file.name).toEqual('file.txt');
    expect(file.lastModified).toEqual(123);
  });
});
