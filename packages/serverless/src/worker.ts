import { clearCache, Deployment } from '@lagon/runtime';
import { deployments } from 'src/deployments/config';
import startServer from 'src/server';
import { shouldClearCache } from './deployments/result';

function deploy(deployment: Deployment) {
  // TODO: undeploy previous deployment with same functionId
  const { domains, deploymentId } = deployment;

  console.log(
    'Deploy',
    deploymentId,
    'to',
    `${deploymentId}.${process.env.LAGON_ROOT_DOMAIN}`,
    deployment.isCurrent ? `and ${deployment.functionName}.${process.env.LAGON_ROOT_DOMAIN} ${domains.join(', ')}` : '',
  );

  if (deployment.isCurrent) {
    deployments.set(`${deployment.functionName}.${process.env.LAGON_ROOT_DOMAIN}`, deployment);

    for (const domain of domains) {
      deployments.set(domain, deployment);
    }
  }

  deployments.set(`${deploymentId}.${process.env.LAGON_ROOT_DOMAIN}`, deployment);

  clearCache(deployment);
}

function undeploy(deployment: Deployment) {
  const { domains, deploymentId } = deployment;

  console.log(
    'Undeploy',
    deploymentId,
    'from',
    `${deploymentId}.${process.env.LAGON_ROOT_DOMAIN}`,
    deployment.isCurrent ? `and ${deployment.functionName}.${process.env.LAGON_ROOT_DOMAIN} ${domains.join(', ')}` : '',
  );

  if (deployment.isCurrent) {
    deployments.delete(`${deployment.functionName}.${process.env.LAGON_ROOT_DOMAIN}`);

    for (const domain of domains) {
      deployments.delete(domain);
    }
  }

  deployments.delete(`${deploymentId}.${process.env.LAGON_ROOT_DOMAIN}`);

  clearCache(deployment);
}

function changeCurrentDeployment(deployment: Deployment & { previousDeploymentId: string }) {
  undeploy({
    ...deployment,
    deploymentId: deployment.previousDeploymentId,
  });

  deploy({
    ...deployment,
    deploymentId: deployment.previousDeploymentId,
    isCurrent: false,
  });

  undeploy({
    ...deployment,
    isCurrent: false,
  });

  deploy(deployment);
}

export default function worker() {
  const port = Number(process.env.LAGON_PORT || 4000);
  const host = process.env.LAGON_HOST || '127.0.0.1';

  // Send a message to receive `deployments` message back
  process.send?.('ok');

  process.on('message', message => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { msg, data } = message;

    switch (msg) {
      case 'deployments': {
        data.forEach(deploy);
        break;
      }
      case 'deploy': {
        deploy(data);
        break;
      }
      case 'undeploy': {
        undeploy(data);
        break;
      }
      case 'current': {
        changeCurrentDeployment(data);
        break;
      }
      case 'clean': {
        const now = new Date();

        for (const deployment of deployments.values()) {
          if (shouldClearCache(deployment, now)) {
            clearCache(deployment);
          }
        }
        break;
      }
      default:
        break;
    }
  });

  startServer(port, host);
}
