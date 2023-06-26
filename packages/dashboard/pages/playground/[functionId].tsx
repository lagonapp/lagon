import { useMonaco } from '@monaco-editor/react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import FunctionLinks from 'lib/components/FunctionLinks';
import Playground from 'lib/components/Playground';
import useFunction from 'lib/hooks/useFunction';
import { getFullCurrentDomain } from 'lib/utils';
import { Text, Button, Form, LogLine } from '@lagon/ui';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import useFunctionCode from 'lib/hooks/useFunctionCode';
import { useScopedI18n } from 'locales';
import { trpc } from 'lib/trpc';
import useEsbuild, { ESBuildStatus } from 'lib/hooks/useEsbuild';

const EsBuildTip: React.FC<{ esbuildStatus: ESBuildStatus }> = ({ esbuildStatus }) => {
  const t = useScopedI18n('playground');
  return [ESBuildStatus.Fail, ESBuildStatus.Loading].includes(esbuildStatus) ? (
    <div className=" w-full">
      <LogLine
        level={esbuildStatus === ESBuildStatus.Loading ? 'warn' : 'error'}
        message={esbuildStatus === ESBuildStatus.Loading ? t('esbuild.loading') : t('esbuild.error')}
        hiddenCopy
      />
    </div>
  ) : (
    <></>
  );
};

const PlaygroundPage = () => {
  const {
    query: { functionId },
  } = useRouter();
  const { data: func } = useFunction(functionId as string);
  const { data: functionCode } = useFunctionCode(functionId as string);
  const createDeployment = trpc.deploymentCreate.useMutation();
  const deployDeployment = trpc.deploymentDeploy.useMutation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const monaco = useMonaco();
  const t = useScopedI18n('playground');
  const { isEsbuildLoading, esbuildStatus, build } = useEsbuild();
  const [isLoading, setIsLoading] = useState(false);

  const reloadIframe = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src += '';
    }
  }, [iframeRef]);

  return (
    <>
      <div className="flex h-12 w-screen border-b border-b-stone-200 dark:border-b-stone-700">
        <Form
          onSubmit={async () => {
            if (!monaco || !func) {
              return;
            }

            let code = monaco.editor.getModels()[0].getValue();

            if (code.startsWith('declare interface RequestInit {')) {
              code = monaco.editor.getModels()[1].getValue();
            }

            let tsCode = '';

            setIsLoading(true);

            if (esbuildStatus === ESBuildStatus.Success) {
              try {
                tsCode = code;
                const files = new Map<string, { content: string }>();

                files.set('index.ts', {
                  content: code,
                });

                const esbuildResult = await build(files);

                if (esbuildResult.outputFiles?.[0]) {
                  code = esbuildResult.outputFiles[0].text;
                } else {
                  esbuildResult.errors.forEach(e => {
                    console.error(e);
                  });
                }
              } catch (e) {
                console.error(e);
              }
            }

            const deployment = await createDeployment.mutateAsync({
              functionId: func.id,
              functionSize: new TextEncoder().encode(code).length,
              tsSize: new TextEncoder().encode(tsCode).length,
              platform: 'Playground',
              assets: [],
            });

            await Promise.all([
              fetch(deployment.codeUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'text/javascript',
                },
                body: code,
              }),
              ...(tsCode.length > 0
                ? [
                    fetch(deployment.tsCodeUrl!, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'text/javascript',
                      },
                      body: tsCode,
                    }),
                  ]
                : []),
            ]);

            await deployDeployment.mutateAsync({
              functionId: func.id,
              deploymentId: deployment.deploymentId,
              isProduction: true,
            });

            setIsLoading(false);
          }}
          onSubmitSuccess={() => {
            toast.success(t('deploy.success'));

            setTimeout(reloadIframe, 100);
          }}
          onSubmitError={() => {
            toast.error(t('deploy.error'));
          }}
        >
          <div className="flex h-full w-[50vw] items-center justify-between px-2">
            <Text>
              {t('title', {
                functionName: func?.name || '',
              })}
            </Text>
            <div className="flex items-center gap-2">
              <Button href={`/functions/${func?.id}`}>{t('back')}</Button>
              <Button
                variant="primary"
                leftIcon={<PlayIcon className="h-4 w-4" />}
                submit
                disabled={isLoading || isEsbuildLoading}
              >
                {t('deploy')}
              </Button>
            </div>
          </div>
        </Form>
        <div className="flex w-[50vw] items-center gap-4 border-l border-l-stone-200 px-2 dark:border-l-stone-700">
          <Button onClick={reloadIframe} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
            {t('reload')}
          </Button>
          {func ? <FunctionLinks func={func} /> : null}
        </div>
      </div>
      <div className="flex w-screen" style={{ height: 'calc(100vh - 4rem - 3rem)' }}>
        <Playground defaultValue={functionCode?.code || ''} width="50vw" height="100%" />
        <div className="flex w-[50vw] flex-col border-l border-l-stone-200 dark:border-b-stone-700">
          <EsBuildTip esbuildStatus={esbuildStatus} />
          {func ? <iframe ref={iframeRef} className="h-full w-full" src={getFullCurrentDomain(func)} /> : null}
        </div>
      </div>
    </>
  );
};

PlaygroundPage.title = 'Playground';

export default PlaygroundPage;
