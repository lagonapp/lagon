import { Suspense, useState } from 'react';
import FunctionsList from 'lib/pages/functions/FunctionsList';
import LayoutTitle from 'lib/components/LayoutTitle';
import { Button, Skeleton } from '@lagon/ui';
import { trpc } from 'lib/trpc';
import { useRouter } from 'next/router';
import { getLocaleProps, useI18n } from 'locales';
import { GetStaticProps } from 'next';

const Home = () => {
  const createFunction = trpc.functionCreate.useMutation();
  const createDeployment = trpc.deploymentCreate.useMutation();
  const deployDeployment = trpc.deploymentDeploy.useMutation();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('home');

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
              assets: [],
            });

            await fetch(deployment.codeUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'text/javascript',
              },
              body: `export function handler(request) {
  return new Response("Hello World!")
}`,
            });

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
