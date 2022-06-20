export type DeploymentLogLevel = 'log' | 'error' | 'info' | 'warn' | 'debug';

export type DeploymentLog = {
  content: string;
  level: DeploymentLogLevel;
};

export type OnDeploymentLog = ({ deploymentId, log }: { deploymentId: string; log: DeploymentLog }) => void;

export function addLog({
  deploymentId,
  onDeploymentLog,
  logLevel,
}: {
  deploymentId: string;
  onDeploymentLog?: OnDeploymentLog;
  logLevel: DeploymentLogLevel;
}) {
  return function (...args: unknown[]) {
    const logContent = args.map(arg => JSON.stringify(arg)).join(' ');

    onDeploymentLog?.({
      deploymentId,
      log: {
        level: logLevel,
        content: logContent,
      },
    });
  };
}
