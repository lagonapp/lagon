import { useMonaco } from '@monaco-editor/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Form from 'lib/components/Form';
import FunctionLinks from 'lib/components/FunctionLinks';
import Input from 'lib/components/Input';
import Playground from 'lib/components/Playground';
import useFunction from 'lib/hooks/useFunction';
import Layout from 'lib/Layout';
import { getFullCurrentDomain } from 'lib/utils';
import { requiredValidator } from 'lib/form/validators';

const PlaygroundPage = () => {
  const { data: session } = useSession();
  const {
    query: { functionId },
  } = useRouter();
  const { data: func } = useFunction(functionId as string);
  const iframeRef = useRef<HTMLIFrameElement>();
  const monaco = useMonaco();
  const [isDeploying, setIsDeploying] = useState(false);

  const reloadIframe = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src += '';
    }
  }, [iframeRef]);

  return (
    <Layout title="Playground" headerOnly>
      <div className="w-screen h-12 flex border-b border-b-gray-200">
        <Form
          initialValues={{
            name: func.name,
          }}
          onSubmit={async ({ name }) => {
            setIsDeploying(true);

            if (name !== func.name) {
              await fetch(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  ...func,
                  name,
                }),
              });
            }

            let code = monaco.editor.getModels()[0].getValue();

            if (code.startsWith('declare interface RequestInit {')) {
              code = monaco.editor.getModels()[1].getValue();
            }

            await fetch(`/api/organizations/${session.organization.id}/functions/${func.id}/deploy`, {
              method: 'POST',
              body: JSON.stringify({
                code,
                shouldTransformCode: true,
              }),
            });
          }}
          onSubmitSuccess={() => {
            toast.success('Function deployed successfully.');
            reloadIframe();

            setTimeout(() => {
              setIsDeploying(false);
            }, 100);
          }}
          onSubmitError={() => {
            toast.error('Failed to deploy function.');
            setIsDeploying(false);
          }}
        >
          <div className="w-[50vw] flex justify-between px-2 items-center h-full">
            <Input name="name" placeholder="Function name" disabled={isDeploying} validator={requiredValidator} />
            <div className="flex items-center gap-2">
              <Button href={`/functions/${func.id}`}>Settings</Button>
              <Button variant="primary" submit disabled={isDeploying}>
                Deploy
              </Button>
            </div>
          </div>
        </Form>
        <div className="w-[50vw] border-l border-l-gray-200 px-2 flex items-center gap-2">
          <Button onClick={reloadIframe}>Reload</Button>
          <FunctionLinks func={func} />
        </div>
      </div>
      <div className="w-screen flex" style={{ height: 'calc(100vh - 4rem - 3rem)' }}>
        <Playground
          defaultValue={`export async function handler(request: Request): Promise<Response> {
  return new Response('Hello World!');
}`}
          width="50vw"
          height="100%"
        />
        <div className="w-[50vw] border-l border-l-gray-200">
          <iframe ref={iframeRef} className="w-full h-full" src={getFullCurrentDomain(func)} />
        </div>
      </div>
    </Layout>
  );
};

export default PlaygroundPage;
