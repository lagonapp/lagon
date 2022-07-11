import { Deployment } from './deployments';
import type { Reference, Isolate, Context } from 'isolated-vm';

export { fetch } from './fetch';
export { DeploymentResult, Deployment, clearCache } from './deployments';
export { addLog, DeploymentLog, DeploymentLogLevel, OnDeploymentLog } from './deployments/log';
export { getIsolate } from './isolate';

export type DeploymentCache = { handler: Reference<unknown>; isolate: Isolate; context: Context };
export type GetDeploymentCodeFn = (deployment: Deployment) => Promise<string>;
export type OnReceiveStream = (deployment: Deployment, done: boolean, chunk?: Uint8Array) => void;
export type HandlerRequest = {
  input: string;
  options: {
    method: string;
    headers: Record<string, string | string[] | undefined>;
    body?: string;
  };
};
