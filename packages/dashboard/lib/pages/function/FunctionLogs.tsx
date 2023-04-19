import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Suspense, useEffect, useState } from 'react';
import { Button, Card, Divider, EmptyState, LOGS_LEVELS, LogLine, LogsLevel, Menu, Skeleton } from '@lagon/ui';
import useFunctionLogs from 'lib/hooks/useFunctionLogs';
import { LOGS_TIMEFRAMES, LogsTimeframe } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useScopedI18n } from 'locales';

type ContentProps = {
  func: ReturnType<typeof useFunction>['data'];
  level: LogsLevel;
  timeframe: LogsTimeframe;
};

const Content = ({ func, level, timeframe }: ContentProps) => {
  const t = useScopedI18n('functions.logs');
  const { data: logs } = useFunctionLogs({ functionId: func?.id, level, timeframe });

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
            level={level.toLowerCase() as LogsLevel}
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
  const t = useScopedI18n('functions.logs');
  const [logsLevel, setLogsLevel] = useState<LogsLevel>(() => (router.query.logLevel as LogsLevel) || 'all');
  const [timeframe, setTimeframe] = useState<LogsTimeframe>(
    () => (router.query.logsTimeframe as LogsTimeframe) || 'Last hour',
  );

  useEffect(() => {
    router.replace({
      query: {
        ...router.query,
        logsTimeframe: timeframe,
        logsLevel,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, logsLevel]);

  return (
    <Card
      title="Live Logs and Errors"
      rightItem={
        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>
                {t('logLevel')}&nbsp;{logsLevel}
              </Button>
            </Menu.Button>
            <Menu.Items>
              {LOGS_LEVELS.filter(item => item !== 'all').map(item => (
                <Menu.Item key={item} disabled={logsLevel === item} onClick={() => setLogsLevel(item)}>
                  {item}
                </Menu.Item>
              ))}
              <Divider />
              <Menu.Item disabled={logsLevel === 'all'} onClick={() => setLogsLevel('all')}>
                all
              </Menu.Item>
            </Menu.Items>
          </Menu>
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>{timeframe}</Button>
            </Menu.Button>
            <Menu.Items>
              {LOGS_TIMEFRAMES.map(item => (
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
        <Content func={func} level={logsLevel} timeframe={timeframe} />
      </Suspense>
    </Card>
  );
};

export default FunctionLogs;
