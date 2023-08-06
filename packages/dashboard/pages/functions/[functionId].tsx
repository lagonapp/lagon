import { useRouter } from 'next/router';
import useFunction from 'lib/hooks/useFunction';
import FunctionOverview from 'lib/pages/function/FunctionOverview';
import FunctionSettings from 'lib/pages/function/FunctionSettings';
import FunctionDeployments from 'lib/pages/function/FunctionDeployments';
import FunctionLogs from 'lib/pages/function/FunctionLogs';
import { Button, Nav } from '@lagon/ui';
import { PlayIcon } from '@heroicons/react/24/outline';
import Head from 'next/head';
import LayoutTitle from 'lib/components/LayoutTitle';
import FunctionLinks from 'lib/components/FunctionLinks';
import { useScopedI18n } from 'locales';
import { getHumanFriendlyCron } from 'lib/utils';

const Function = () => {
  const {
    query: { functionId },
  } = useRouter();
  const t = useScopedI18n('function.nav');

  const { data: func, refetch } = useFunction(functionId as string, false);

  return (
    <LayoutTitle
      title={func?.name || 'Loading...'}
      titleStatus="success"
      rightItem={
        func?.cron === null ? (
          <FunctionLinks func={func} />
        ) : (
          <span className="text-sm text-blue-500">{getHumanFriendlyCron(func?.cron)}</span>
        )
      }
    >
      {func?.name ? (
        <Head>
          <title>{func.name} - Lagon</title>
        </Head>
      ) : null}
      <Nav defaultValue="overview">
        <Nav.List
          {...(func?.platform === 'Playground'
            ? {
                rightItem: (
                  <Button href={`/playground/${func?.id}`} leftIcon={<PlayIcon className="h-4 w-4" />}>
                    {t('playground')}
                  </Button>
                ),
              }
            : {})}
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

Function.title = 'Overview';

export default Function;
