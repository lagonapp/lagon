import { Deployment } from '@lagon/runtime';

const LAGON_REGION = process.env.LAGON_REGION;

if (!LAGON_REGION) {
  throw new Error('LAGON_REGION is not set');
}

const deployments = new Map<string, Deployment>();

export function getDeployments(): Map<string, Deployment> {
  return deployments;
}

export function setDeployment(domain: string, deployment: Deployment) {
  deployments.set(domain, {
    ...deployment,
    env: {
      ...deployment.env,
      LAGON_REGION: LAGON_REGION as string,
    },
  });
}

export function deleteDeployment(domain: string) {
  deployments.delete(domain);
}

export function clearDeployments() {
  deployments.clear();
}
