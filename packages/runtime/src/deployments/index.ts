import { DeploymentCache } from '..';
import { DeploymentLog } from './log';

export const deploymentsCache = new Map<string, DeploymentCache>();

export type DeploymentResult = {
  logs: DeploymentLog[];
  cpuTime: bigint;
  memory: number;
  receivedBytes: number;
  sentBytes: number;
};

export type Deployment = {
  functionId: string;
  functionName: string;
  deploymentId: string;
  domains: string[];
  memory: number;
  timeout: number;
  env: Record<string, string>;
  isCurrent: boolean;
};

export function clearCache(deployment: Deployment) {
  const deploymentCache = deploymentsCache.get(deployment.deploymentId);

  if (deploymentCache) {
    deploymentCache.isolate.dispose();
    deploymentCache.context.release();

    deploymentsCache.delete(deployment.deploymentId);
  }
}
