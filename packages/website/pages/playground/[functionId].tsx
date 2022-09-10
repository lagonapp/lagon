import { useMonaco } from '@monaco-editor/react';
import { useRouter } from 'next/router';
import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Form from 'lib/components/Form';
import FunctionLinks from 'lib/components/FunctionLinks';
import Playground from 'lib/components/Playground';
import useFunction from 'lib/hooks/useFunction';
import { getFullCurrentDomain } from 'lib/utils';
import Text from 'lib/components/Text';
import { PlayIcon, RefreshIcon } from '@heroicons/react/outline';
import useFunctionCode from 'lib/hooks/useFunctionCode';
import { useI18n } from 'locales';

const PlaygroundPage = () => {
  const {
    query: { functionId },
  } = useRouter();
  const { data: func } = useFunction(functionId as string);
  const { data: functionCode } = useFunctionCode(functionId as string);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const monaco = useMonaco();
  const { scopedT } = useI18n();
  const t = scopedT('playground');

  const reloadIframe = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src += '';
    }
  }, [iframeRef]);

  return (
    <>
      <div className="w-screen h-12 flex border-b border-b-stone-200 dark:border-b-stone-700">
        <Form
          onSubmit={async () => {
            if (!monaco) {
              return;
            }

            let code = monaco.editor.getModels()[0].getValue();

            if (code.startsWith('declare interface RequestInit {')) {
              code = monaco.editor.getModels()[1].getValue();
            }

            const body = new FormData();

            body.set('functionId', func!.id);
            body.set('code', new File([code], 'index.js'));

            await fetch('/api/deployment', {
              method: 'POST',
              body,
            });
          }}
          onSubmitSuccess={() => {
            toast.success(t('deploy.success'));

            setTimeout(reloadIframe, 100);
          }}
          onSubmitError={() => {
            toast.error(t('deploy.error'));
          }}
        >
          <div className="w-[50vw] flex justify-between px-2 items-center h-full">
            <Text>
              {t('title', {
                functionName: func?.name || '',
              })}
            </Text>
            <div className="flex items-center gap-2">
              <Button href={`/functions/${func?.id}`}>{t('back')}</Button>
              <Button
                variant="primary"
                leftIcon={<PlayIcon className="w-4 h-4" />}
                submit
                // TODO
                // disabled={deployFunction.isLoading}
              >
                {t('deploy')}
              </Button>
            </div>
          </div>
        </Form>
        <div className="w-[50vw] border-l border-l-stone-200 dark:border-l-stone-700 px-2 flex items-center gap-4">
          <Button onClick={reloadIframe} leftIcon={<RefreshIcon className="w-4 h-4" />}>
            {t('reload')}
          </Button>
          {func ? <FunctionLinks func={func} /> : null}
        </div>
      </div>
      <div className="w-screen flex" style={{ height: 'calc(100vh - 4rem - 3rem)' }}>
        <Playground defaultValue={functionCode?.code || ''} width="50vw" height="100%" />
        <div className="w-[50vw] border-l border-l-stone-200 dark:border-b-stone-700">
          {func ? <iframe ref={iframeRef} className="w-full h-full" src={getFullCurrentDomain(func)} /> : null}
        </div>
      </div>
    </>
  );
};

PlaygroundPage.title = 'Playground';

export default PlaygroundPage;
