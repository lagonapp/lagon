import { Deployment } from '@lagon/runtime';

const deployments = new Map<string, Deployment>();

export function getDeployments(): Map<string, Deployment> {
  return deployments;
}

export function setDeployment(domain: string, deployment: Deployment) {
  deployments.set(domain, deployment);
}

export function deleteDeployment(domain: string) {
  deployments.delete(domain);
}

export function clearDeployments() {
  deployments.clear();
}
