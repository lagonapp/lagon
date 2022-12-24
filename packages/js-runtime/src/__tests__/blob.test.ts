import { describe, it, expect } from 'vitest';
import '../';

describe('Blob', () => {
  it('should allow empty blobs', () => {
    const blob = new Blob();
    expect(blob.size).toEqual(0);
    expect(blob.type).toEqual('');
  });

  it('should set the type', () => {
    const blob = new Blob([], { type: 'text/plain' });
    expect(blob.size).toEqual(0);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with string', () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    expect(blob.size).toEqual(5);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with multiple strings', () => {
    const blob = new Blob(['hello', 'world'], { type: 'text/plain' });
    expect(blob.size).toEqual(10);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with Blob', () => {
    const blob = new Blob([new Blob(['hello'])], { type: 'text/plain' });
    expect(blob.size).toEqual(5);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with multiple Blobs', () => {
    const blob = new Blob([new Blob(['hello']), new Blob(['world'])], { type: 'text/plain' });
    expect(blob.size).toEqual(10);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with ArrayBuffer', () => {
    const blob = new Blob([new ArrayBuffer(5)], { type: 'text/plain' });
    expect(blob.size).toEqual(5);
    expect(blob.type).toEqual('text/plain');
  });

  it('should init with different types', () => {
    const blob = new Blob(['hello', new ArrayBuffer(5), new Blob(['world'])], { type: 'text/plain' });
    expect(blob.size).toEqual(15);
    expect(blob.type).toEqual('text/plain');
  });

  it('should transform to ArrayBuffer', async () => {
    const blob = new Blob(['hello']);
    const buffer = await blob.arrayBuffer();
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toEqual(5);
    expect(buffer).toEqual(new TextEncoder().encode('hello').buffer);
  });

  it('should slice', async () => {
    const blob = new Blob(['hello world']);
    const sliced = blob.slice(6);
    expect(sliced.size).toEqual(5);
    expect(await sliced.text()).toEqual('world');
  });

  it('should slice with start', async () => {
    const blob = new Blob(['hello world']);
    const sliced = blob.slice(6, 11);
    expect(sliced.size).toEqual(5);
    expect(await sliced.text()).toEqual('world');
  });

  it('should slice with start and end', async () => {
    const blob = new Blob(['hello world']);
    const sliced = blob.slice(0, 5);
    expect(sliced.size).toEqual(5);
    expect(await sliced.text()).toEqual('hello');
  });

  it('should slice with negative start', async () => {
    const blob = new Blob(['hello world']);
    const sliced = blob.slice(-5);
    expect(sliced.size).toEqual(5);
    expect(await sliced.text()).toEqual('world');
  });

  it('should slice with negative start and end', async () => {
    const blob = new Blob(['hello world']);
    const sliced = blob.slice(-5, -1);
    expect(sliced.size).toEqual(4);
    expect(await sliced.text()).toEqual('worl');
  });

  it('should transform to text', async () => {
    const blob = new Blob(['hello']);
    const text = await blob.text();
    expect(text).toEqual('hello');
  });

  it('should transform to ReadableStream', async () => {
    const blob = new Blob(['hello']);
    const stream = blob.stream();
    const reader = stream.getReader();
    const { done, value } = await reader.read();
    expect(done).toEqual(false);
    expect(value).toEqual(new TextEncoder().encode('hello'));
    const { done: done2 } = await reader.read();
    expect(done2).toEqual(true);
  });
});
