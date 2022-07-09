import { useRouter } from 'next/router';
import Nav from 'lib/components/Nav';
import useFunction from 'lib/hooks/useFunction';
import Layout from 'lib/Layout';
import FunctionOverview from 'lib/pages/function/FunctionOverview';
import FunctionSettings from 'lib/pages/function/FunctionSettings';
import FunctionDeployments from 'lib/pages/function/FunctionDeployments';
import FunctionLogs from 'lib/pages/function/FunctionLogs';
import FunctionLinks from 'lib/components/FunctionLinks';
import Button from 'lib/components/Button';
import { PlayIcon } from '@heroicons/react/outline';

const Function = () => {
  const {
    query: { functionId },
  } = useRouter();

  const { data: func, refetch } = useFunction(functionId as string);

  return (
    <Layout title={func?.name || 'Loading'} titleStatus="success" rightItem={<FunctionLinks func={func} />}>
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
    </Layout>
  );
};

export default Function;
