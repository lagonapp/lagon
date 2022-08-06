import { Deployment } from '@lagon/runtime';
import { deployments, getBytesFromReply, getBytesFromRequest, getDeploymentFromRequest } from 'src/deployments/utils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Misc', () => {
  describe('getDeploymentFromRequest', () => {
    beforeAll(() => {
      deployments.clear();
    });

    it('should return deployment from host header', () => {
      const deployment: Deployment = {
        functionId: 'functionId',
        functionName: 'functionName',
        deploymentId: 'deploymentId',
        domains: [],
        memory: 128,
        timeout: 50,
        env: {},
        isCurrent: false,
        assets: [],
      };

      deployments.set('localhost', deployment);

      // @ts-expect-error only mock needed properties
      expect(getDeploymentFromRequest({ headers: { host: 'localhost' } })).toEqual(deployment);
    });

    it('should return undefined if header does not exists', () => {
      // @ts-expect-error only mock needed properties
      expect(getDeploymentFromRequest({ headers: {} })).toBeUndefined();
    });
  });

  describe('getBytesFrom*', () => {
    it('should return bytes', () => {
      expect(
        // @ts-expect-error only mock needed properties
        getBytesFromRequest({
          headers: {
            'content-type': 'application/json',
          },
        }),
      ).toEqual(28);

      expect(
        getBytesFromReply({
          getHeader: () => undefined,
          headers: {
            // @ts-expect-error only mock needed properties
            'content-type': 'application/json',
          },
        }),
      ).toEqual(28);
    });

    it('should return bytes with content length', () => {
      expect(
        // @ts-expect-error only mock needed properties
        getBytesFromRequest({
          headers: {
            'content-length': '100',
            'content-type': 'application/json',
          },
        }),
      ).toEqual(145);

      expect(
        getBytesFromReply({
          getHeader: () => '100',
          headers: {
            // @ts-expect-error only mock needed properties
            'content-type': 'application/json',
          },
        }),
      ).toEqual(128);
    });
  });
});
