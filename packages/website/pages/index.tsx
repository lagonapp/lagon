import { useRouter } from 'next/router';
import { Suspense } from 'react';
import Button from 'lib/components/Button';
import Skeleton from 'lib/components/Skeleton';
import Layout from 'lib/Layout';
import FunctionsList from 'lib/pages/functions/FunctionsList';
import useRandomName from '@scaleway/use-random-name';
import { trpc } from 'lib/trpc';

const Home = () => {
  const router = useRouter();
  const createFunction = trpc.useMutation(['functions.create']);
  const name = useRandomName();

  return (
    <Layout
      title="Functions"
      rightItem={
        <Button
          variant="primary"
          disabled={createFunction.isLoading}
          onClick={async () => {
            const func = await createFunction.mutateAsync({
              name,
              domains: [],
              env: [],
              cron: null,
              code: `export function handler(request) {
  return new Response('Hello World!', {
    headers: {
      'content-type': 'text/html'
    }
  });
}`,
              assets: [],
            });

            router.push(`/playground/${func.id}`);
          }}
        >
          Create Function
        </Button>
      }
    >
      <Suspense fallback={<Skeleton variant="card" />}>
        <FunctionsList />
      </Suspense>
    </Layout>
  );
};

export default Home;
