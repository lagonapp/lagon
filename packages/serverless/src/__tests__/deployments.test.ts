import { afterEach, describe, expect, it } from 'vitest';
import mockFs from 'mock-fs';
import {
  deleteDeploymentCode,
  deleteOldDeployments,
  DEPLOYMENTS_FOLDER,
  getDeploymentCode,
  hasDeploymentCodeLocally,
  writeAssetContent,
  writeDeploymentCode,
} from 'src/deployments';
import { Deployment } from '@lagon/runtime';
import fs from 'node:fs';
import path from 'node:path';

afterEach(mockFs.restore);

describe('Deployments', () => {
  it('should delete old deployments', () => {
    mockFs({
      'dist/deployments': {
        'first.js': '',
        'second.js': '',
        'todelete.js': '',
      },
    });

    deleteOldDeployments([
      {
        deploymentId: 'first',
      },
      {
        deploymentId: 'second',
      },
    ] as Deployment[]);

    expect(hasDeploymentCodeLocally({ deploymentId: 'first' } as Deployment)).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'second' } as Deployment)).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'todelete' } as Deployment)).toEqual(false);
  });

  it('should delete old deployments with their folder if present', () => {
    mockFs({
      'dist/deployments': {
        'first.js': '',
        'second.js': '',
        'todelete.js': '',
        todelete: {},
      },
    });

    deleteOldDeployments([
      {
        deploymentId: 'first',
      },
      {
        deploymentId: 'second',
      },
    ] as Deployment[]);

    expect(hasDeploymentCodeLocally({ deploymentId: 'first' } as Deployment)).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'second' } as Deployment)).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'todelete' } as Deployment)).toEqual(false);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'todelete'))).toEqual(false);
  });

  it('should write deployment files without folder if no assets', () => {
    mockFs({
      'dist/deployments': {},
    });

    writeDeploymentCode(
      {
        deploymentId: 'id',
        assets: [] as string[],
      } as Deployment,
      'code',
    );

    expect(hasDeploymentCodeLocally({ deploymentId: 'id' } as Deployment)).toEqual(true);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'id'))).toEqual(false);
  });

  it('should write deployment files with folder if assets', () => {
    mockFs({
      'dist/deployments': {},
    });

    writeDeploymentCode(
      {
        deploymentId: 'id',
        assets: ['index.css', 'index.js'],
      } as Deployment,
      'code',
    );

    expect(hasDeploymentCodeLocally({ deploymentId: 'id' } as Deployment)).toEqual(true);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'id'))).toEqual(true);
  });

  it('should write assets', () => {
    mockFs({
      'dist/deployments': {
        'id.js': '',
        id: {},
      },
    });

    writeAssetContent('id/index.js', 'code');

    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'id/index.js'))).toEqual(true);
  });

  it('should write assets and create nested folders', () => {
    mockFs({
      'dist/deployments': {
        'id.js': '',
        id: {},
      },
    });

    writeAssetContent('id/assets/index.js', 'code');
    writeAssetContent('id/assets/images/hello.png', 'image');

    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'id/assets/index.js'))).toEqual(true);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'id/assets/images/hello.png'))).toEqual(true);
  });

  it('should delete deployment', () => {
    mockFs({
      'dist/deployments': {
        'first.js': '',
        'todelete.js': '',
      },
    });

    deleteDeploymentCode({ deploymentId: 'todelete' } as Deployment);

    expect(hasDeploymentCodeLocally({ deploymentId: 'first' } as Deployment)).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'todelete' } as Deployment)).toEqual(false);
  });

  it('should delete deployment with his folder', () => {
    mockFs({
      'dist/deployments': {
        'first.js': '',
        first: {},
        'todelete.js': '',
        todelete: {},
      },
    });

    deleteDeploymentCode({ deploymentId: 'todelete' } as Deployment);

    expect(hasDeploymentCodeLocally({ deploymentId: 'first' } as Deployment)).toEqual(true);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'first'))).toEqual(true);
    expect(hasDeploymentCodeLocally({ deploymentId: 'todelete' } as Deployment)).toEqual(false);
    expect(fs.existsSync(path.join(DEPLOYMENTS_FOLDER, 'todelete'))).toEqual(false);
  });

  it('should read deployment code', async () => {
    mockFs({
      'dist/deployments': {
        'id.js': 'code',
      },
    });

    const content = await getDeploymentCode({ deploymentId: 'id' } as Deployment);

    expect(content).toEqual('code');
  });
});
