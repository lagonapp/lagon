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
import { useI18n } from 'locales';

const Function = () => {
  const {
    query: { functionId },
  } = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('function.nav');

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
              {t('playground')}
            </Button>
          }
        >
          <Nav.Link value="overview">{t('overview')}</Nav.Link>
          <Nav.Link value="deployments">{t('deployments')}</Nav.Link>
          <Nav.Link value="logs">{t('logs')}</Nav.Link>
          <Nav.Link value="settings">{t('settings')}</Nav.Link>
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
