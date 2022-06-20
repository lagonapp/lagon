import { Deployment } from '@lagon/runtime';
import { FastifyReply, FastifyRequest } from 'fastify';

export const deployments = new Map<string, Deployment>();

export function getDeploymentFromRequest(req: FastifyRequest): Deployment | undefined {
  const { host } = req.headers;

  if (!host) {
    return;
  }

  return deployments.get(host);
}

function getBytesFromHeaders(headers: { [key: string]: string | string[] | undefined }): number {
  return Object.entries(headers).reduce((acc, [key, value]) => {
    const items = [key];

    if (typeof value === 'object') {
      items.concat(value);
    } else if (value) {
      items.push(value);
    }

    acc += Buffer.byteLength(items.join(''));

    return acc;
  }, 0);
}

export function getBytesFromRequest(request: FastifyRequest): number {
  return Number(request.headers['content-length'] || 0) + getBytesFromHeaders(request.headers);
}

export function getBytesFromReply(reply: FastifyReply): number {
  return (
    Number(reply.getHeader('content-length') || 0) +
    getBytesFromHeaders(reply.headers as unknown as { [key: string]: string | string[] | undefined })
  );
}
