import { GetDeploymentCodeFn, HandlerRequest, OnDeploymentLog } from '../';
import { Deployment, deploymentsCache } from '../deployments';
import ivm from 'isolated-vm';
import { initRuntime, snapshot } from '../isolate/runtime';
import { Response } from '../runtime/Response';
import { OnReceiveStream } from '../';

async function createIsolate({
  deployment,
  onReceiveStream,
  onDeploymentLog,
}: {
  deployment: Deployment;
  onReceiveStream: OnReceiveStream;
  onDeploymentLog?: OnDeploymentLog;
}): Promise<{ isolate: ivm.Isolate; context: ivm.Context }> {
  const isolate = new ivm.Isolate({ memoryLimit: deployment.memory, snapshot });
  const context = await isolate.createContext();

  initRuntime({ deployment, context, onReceiveStream, onDeploymentLog });

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
}): Promise<{ handler: ivm.Reference | undefined; masterHandler: ivm.Reference }> {
  const module = await isolate.compileModule(code, { filename: 'function-isolate.js' });

  await module.instantiate(context, () => {
    throw new Error(`Can't import module, you must bundle all your code in a single file.`);
  });

  await module.evaluate();

  return {
    handler: await module.namespace.get('handler', { reference: true }),
    masterHandler: await module.namespace.get('masterHandler', { reference: true })!,
  };
}

export async function getIsolate({
  deployment,
  getDeploymentCode,
  onReceiveStream,
  onDeploymentLog,
}: {
  deployment: Deployment;
  getDeploymentCode: GetDeploymentCodeFn;
  onReceiveStream: OnReceiveStream;
  onDeploymentLog?: OnDeploymentLog;
}) {
  let deploymentCache = deploymentsCache.get(deployment.deploymentId);

  if (!deploymentCache) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Cache not found, creating:', deployment.deploymentId);
    }

    let code = await getDeploymentCode(deployment);

    code += `
  async function masterHandler(request) {
    const handlerRequest = new Request(request.input, request.options);

    const response = await handler(handlerRequest);

    if (response.body instanceof ReadableStream) {
      streamResponse(response.body);
      response.body = null;

      return response;
    }

    return response;
  }

  export {
    masterHandler,
  }`;

    const { isolate, context } = await createIsolate({ deployment, onReceiveStream, onDeploymentLog });
    const { handler, masterHandler } = await getHandler({ isolate, context, code });

    if (!handler || handler.typeof !== 'function') {
      throw new Error('Function did not export a handler function.');
    }

    deploymentCache = {
      handler: masterHandler,
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
