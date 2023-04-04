import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Suspense, useEffect, useState } from 'react';
import { Button, Card, Divider, EmptyState, LogLine, Menu, Skeleton, LOG_LEVELS } from '@lagon/ui';
import useFunctionLogs from 'lib/hooks/useFunctionLogs';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useI18n } from 'locales';

type LogLevel = typeof LOG_LEVELS[number];

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
    return (
      <EmptyState
        title={t('empty.title')}
        description={t('empty.description')}
        action={
          <Button href="https://docs.lagon.app/cloud/logs" target="_blank">
            {t('empty.action')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col">
      {logs?.map(({ timestamp, level, message }, index) => {
        return (
          <LogLine
            key={`${timestamp}-${index}`}
            date={new Date(timestamp)}
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
        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>
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
              <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>{timeframe}</Button>
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
