import { useRouter } from 'next/router';
import { Suspense, useState } from 'react';
import Button from 'lib/components/Button';
import Skeleton from 'lib/components/Skeleton';
import Layout from 'lib/Layout';
import FunctionsList from 'lib/pages/functions/FunctionsList';
import { useSession } from 'next-auth/react';
import useRandomName from '@scaleway/use-random-name';
import { CreateFunctionResponse } from 'pages/api/organizations/[organizationId]/functions';

const Home = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const name = useRandomName();

  return (
    <Layout
      title="Functions"
      rightItem={
        <Button
          variant="primary"
          disabled={isCreating}
          onClick={async () => {
            setIsCreating(true);

            const response = await fetch(`/api/organizations/${session.organization.id}/functions`, {
              method: 'POST',
              body: JSON.stringify({
                name,
                domains: [],
                env: [],
                code: `export function handler(request) {
  return new Response('Hello world', {
    headers: {
      'content-type': 'text/html; charset=utf-8'
    }
  });
}`,
                shouldTransformCode: true,
              }),
            });

            const func = (await response.json()) as CreateFunctionResponse;

            setIsCreating(false);
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
