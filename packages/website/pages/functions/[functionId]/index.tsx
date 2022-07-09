import { useRouter } from 'next/router';
import Nav from 'lib/components/Nav';
import useFunction from 'lib/hooks/useFunction';
import FunctionOverview from 'lib/pages/function/FunctionOverview';
import FunctionSettings from 'lib/pages/function/FunctionSettings';
import FunctionDeployments from 'lib/pages/function/FunctionDeployments';
import FunctionLogs from 'lib/pages/function/FunctionLogs';
import Button from 'lib/components/Button';
import { PlayIcon } from '@heroicons/react/outline';
import Head from 'next/head';
import LayoutTitle from 'lib/components/LayoutTitle';
import FunctionLinks from 'lib/components/FunctionLinks';

const Function = () => {
  const {
    query: { functionId },
  } = useRouter();

  const { data: func, refetch } = useFunction(functionId as string);

  return (
    <LayoutTitle title={func?.name || 'Loading...'} titleStatus="success" rightItem={<FunctionLinks func={func} />}>
      <Head>
        <title>{func?.name || 'Loading...'}</title>
      </Head>
      <Nav defaultValue="overview">
        <Nav.List
          rightItem={
            <Button href={`/playground/${func?.id}`} leftIcon={<PlayIcon className="w-4 h-4" />}>
              Playground
            </Button>
          }
        >
          <Nav.Link value="overview">Overview</Nav.Link>
          <Nav.Link value="deployments">Deployments</Nav.Link>
          <Nav.Link value="logs">Logs</Nav.Link>
          <Nav.Link value="settings">Settings</Nav.Link>
        </Nav.List>
        <Nav.Content value="overview">
          <FunctionOverview func={func} />
        </Nav.Content>
        <Nav.Content value="deployments">
          <FunctionDeployments func={func} refetch={refetch} />
        </Nav.Content>
        <Nav.Content value="logs">
          <FunctionLogs func={func} />
        </Nav.Content>
        <Nav.Content value="settings">
          <FunctionSettings func={func} refetch={refetch} />
        </Nav.Content>
      </Nav>
    </LayoutTitle>
  );
};

Function.title = 'Loading...';

export default Function;
