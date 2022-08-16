import { ChevronDownIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';
import { Suspense, useEffect, useState } from 'react';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Divider from 'lib/components/Divider';
import EmptyState from 'lib/components/EmptyState';
import LogLine from 'lib/components/LogLine';
import Menu from 'lib/components/Menu';
import Skeleton from 'lib/components/Skeleton';
import useFunctionLogs from 'lib/hooks/useFunctionLogs';
import { LogLevel, LOG_LEVELS, Timeframe, TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useI18n } from 'locales';

type ContentProps = {
  func: ReturnType<typeof useFunction>['data'];
  logLevel: LogLevel;
  timeframe: Timeframe;
};

const Content = ({ func, logLevel, timeframe }: ContentProps) => {
  const { scopedT } = useI18n();
  const t = scopedT('functions.logs');
  const { data: logs } = useFunctionLogs({ functionId: func?.id, logLevel, timeframe });

  if (logs?.length === 0) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />;
  }

  return (
    <div className="flex flex-col">
      {logs?.map(({ createdAt, level, message }, index) => {
        const finalDate = new Date(createdAt);
        finalDate.setHours(finalDate.getHours() - finalDate.getTimezoneOffset() / 60);

        return (
          <LogLine
            key={`${createdAt}-${index}`}
            date={finalDate}
            level={level.toLowerCase() as LogLevel}
            message={message}
          />
        );
      })}
    </div>
  );
};

type FunctionLogsProps = {
  func: ReturnType<typeof useFunction>['data'];
};

const FunctionLogs = ({ func }: FunctionLogsProps) => {
  const router = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('functions.logs');
  const [logLevel, setLogLevel] = useState<LogLevel>(() => (router.query.logLevel as LogLevel) || 'all');
  const [timeframe, setTimeframe] = useState<Timeframe>(() => (router.query.timeframe as Timeframe) || 'Last 24 hours');

  useEffect(() => {
    router.replace({
      query: {
        ...router.query,
        timeframe,
        logLevel,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, logLevel]);

  return (
    <Card
      title="Live Logs and Errors"
      rightItem={
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="w-4 h-4" />}>
                {t('logLevel')}&nbsp;{logLevel}
              </Button>
            </Menu.Button>
            <Menu.Items>
              {LOG_LEVELS.filter(item => item !== 'all').map(item => (
                <Menu.Item key={item} disabled={logLevel === item} onClick={() => setLogLevel(item)}>
                  {item}
                </Menu.Item>
              ))}
              <Divider />
              <Menu.Item disabled={logLevel === 'all'} onClick={() => setLogLevel('all')}>
                all
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="w-4 h-4" />}>{timeframe}</Button>
            </Menu.Button>
            <Menu.Items>
              {TIMEFRAMES.map(item => (
                <Menu.Item key={item} disabled={timeframe === item} onClick={() => setTimeframe(item)}>
                  {item}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </div>
      }
    >
      <Suspense fallback={<Skeleton variant="log" />}>
        <Content func={func} logLevel={logLevel} timeframe={timeframe} />
      </Suspense>
    </Card>
  );
};

export default FunctionLogs;
