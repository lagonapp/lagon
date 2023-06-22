import { Suspense, useState } from 'react';
import FunctionsList from 'lib/pages/functions/FunctionsList';
import LayoutTitle from 'lib/components/LayoutTitle';
import { Button, Skeleton } from '@lagon/ui';
import { trpc } from 'lib/trpc';
import { useRouter } from 'next/router';
import { getLocaleProps, useScopedI18n } from 'locales';
import { GetStaticProps } from 'next';
import { DEFAULT_FUNCTION, DEFAULT_TS_FUNCTION } from 'lib/constants';

const Home = () => {
  const createFunction = trpc.functionCreate.useMutation();
  const createDeployment = trpc.deploymentCreate.useMutation();
  const deployDeployment = trpc.deploymentDeploy.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useScopedI18n('home');

  return (
    <LayoutTitle
      title={t('title')}
      rightItem={
        <Button
          variant="primary"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);

            const func = await createFunction.mutateAsync({
              domains: [],
              env: [],
              cron: null,
            });

            const deployment = await createDeployment.mutateAsync({
              functionId: func.id,
              functionSize: new TextEncoder().encode(DEFAULT_FUNCTION).length,
              tsSize: new TextEncoder().encode(DEFAULT_TS_FUNCTION).length,
              assets: [],
            });

            await Promise.all([
              fetch(deployment.codeUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'text/javascript',
                },
                body: DEFAULT_FUNCTION,
              }),
              fetch(deployment.tsCodeUrl!, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'text/javascript',
                },
                body: DEFAULT_TS_FUNCTION,
              }),
            ]);

            await deployDeployment.mutateAsync({
              functionId: func.id,
              deploymentId: deployment.deploymentId,
              isProduction: true,
            });

            setIsLoading(false);

            router.push(`/playground/${func.id}`);
          }}
        >
          {t('createFunction')}
        </Button>
      }
    >
      <Suspense fallback={<Skeleton variant="card" />}>
        <FunctionsList />
      </Suspense>
    </LayoutTitle>
  );
};

Home.title = 'Functions';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default Home;
