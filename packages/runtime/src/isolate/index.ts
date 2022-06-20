import { GetDeploymentCodeFn, HandlerRequest, OnDeploymentLog } from '../';
import { Deployment, deploymentsCache } from '../deployments';
import ivm from 'isolated-vm';
import { initRuntime, snapshot } from '../isolate/runtime';
import { Response } from '../runtime/Response';

async function createIsolate({
  deployment,
  onDeploymentLog,
}: {
  deployment: Deployment;
  onDeploymentLog?: OnDeploymentLog;
}): Promise<{ isolate: ivm.Isolate; context: ivm.Context }> {
  const isolate = new ivm.Isolate({ memoryLimit: deployment.memory, snapshot });
  const context = await isolate.createContext();

  initRuntime({ deployment, context, onDeploymentLog });

  return {
    isolate,
    context,
  };
}

async function getHandler({
  isolate,
  context,
  code,
}: {
  isolate: ivm.Isolate;
  context: ivm.Context;
  code: string;
}): Promise<ivm.Reference | undefined> {
  const module = await isolate.compileModule(code);

  await module.instantiate(context, specifier => {
    throw new Error(`Module ${specifier} not implemented`);
  });

  await module.evaluate();

  return module.namespace.get('masterHandler', { reference: true });
}

export async function getIsolate({
  deployment,
  getDeploymentCode,
  onDeploymentLog,
}: {
  deployment: Deployment;
  getDeploymentCode: GetDeploymentCodeFn;
  onDeploymentLog?: OnDeploymentLog;
}) {
  let deploymentCache = deploymentsCache.get(deployment.deploymentId);

  if (!deploymentCache) {
    console.log('Cache not found, creating:', deployment.deploymentId);
    let code = await getDeploymentCode(deployment);

    // TODO: disable `eval` within the isolate?
    code = code.replace(/eval.*\)/g, '');

    code += `
  async function masterHandler(request) {
    const handlerRequest = new Request(request.input, request.options);

    return handler(handlerRequest)
  }

  export {
    masterHandler,
  }`;

    const { isolate, context } = await createIsolate({ deployment, onDeploymentLog });
    const handler = await getHandler({ isolate, context, code });

    if (!handler || handler.typeof !== 'function') {
      throw new Error('Function did not export a handler');
    }

    deploymentCache = {
      handler,
      isolate,
      context,
    };

    deploymentsCache.set(deployment.deploymentId, deploymentCache);
  }

  const { handler, isolate } = deploymentCache;

  return async (request: HandlerRequest) => {
    const response = await (handler?.apply(undefined, [request], {
      result: { promise: true, copy: true },
      arguments: { copy: true },
      timeout: deployment.timeout,
    }) as Promise<Response>);

    return {
      isolate,
      response,
    };
  };
}
