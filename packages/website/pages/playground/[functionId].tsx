import { useMonaco } from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Form from 'lib/components/Form';
import FunctionLinks from 'lib/components/FunctionLinks';
import Playground from 'lib/components/Playground';
import useFunction from 'lib/hooks/useFunction';
import Layout from 'lib/Layout';
import { fetchApi, getFullCurrentDomain } from 'lib/utils';
import Text from 'lib/components/Text';
import { PlayIcon, RefreshIcon } from '@heroicons/react/outline';
import useFunctionCode from 'lib/hooks/useFunctionCode';

const PlaygroundPage = () => {
  const { data: session } = useSession();
  const {
    query: { functionId },
  } = useRouter();
  const { data: func } = useFunction(functionId as string);
  const { data: functionCode } = useFunctionCode(functionId as string);
  const iframeRef = useRef<HTMLIFrameElement>();
  const monaco = useMonaco();
  const [isDeploying, setIsDeploying] = useState(false);

  const reloadIframe = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src += '';
    }
  }, [iframeRef]);

  return (
    <Layout title={`${func.name} playground`} headerOnly>
      <div className="w-screen h-12 flex border-b border-b-stone-200">
        <Form
          onSubmit={async () => {
            setIsDeploying(true);
            let code = monaco.editor.getModels()[0].getValue();

            if (code.startsWith('declare interface RequestInit {')) {
              code = monaco.editor.getModels()[1].getValue();
            }

            await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}/deploy`, {
              method: 'POST',
              body: JSON.stringify({
                code,
                shouldTransformCode: true,
              }),
            });
          }}
          onSubmitSuccess={() => {
            toast.success('Function deployed successfully.');
            setIsDeploying(false);

            setTimeout(reloadIframe, 100);
          }}
          onSubmitError={() => {
            toast.error('Failed to deploy function.');
            setIsDeploying(false);
          }}
        >
          <div className="w-[50vw] flex justify-between px-2 items-center h-full">
            <Text>{func.name} playground</Text>
            <div className="flex items-center gap-2">
              <Button href={`/functions/${func.id}`}>Back to function</Button>
              <Button variant="primary" leftIcon={<PlayIcon className="w-4 h-4" />} submit disabled={isDeploying}>
                Deploy
              </Button>
            </div>
          </div>
        </Form>
        <div className="w-[50vw] border-l border-l-stone-200 px-2 flex items-center gap-4">
          <Button onClick={reloadIframe} leftIcon={<RefreshIcon className="w-4 h-4" />}>
            Reload
          </Button>
          <FunctionLinks func={func} />
        </div>
      </div>
      <div className="w-screen flex" style={{ height: 'calc(100vh - 4rem - 3rem)' }}>
        <Playground defaultValue={functionCode.code} width="50vw" height="100%" />
        <div className="w-[50vw] border-l border-l-stone-200">
          <iframe ref={iframeRef} className="w-full h-full" src={getFullCurrentDomain(func)} />
        </div>
      </div>
    </Layout>
  );
};

export default PlaygroundPage;
