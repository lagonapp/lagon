import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Button, Card, Chart, Description, Divider, Menu, Skeleton, Text } from '@lagon/ui';
import useFunctionStats from 'lib/hooks/useFunctionStats';
import { AnalyticsTimeframe, ANALYTICS_TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useScopedI18n } from 'locales';
import { getPlanFromPriceId } from 'lib/plans';
import { useSession } from 'next-auth/react';

function formatBytes(bytes = 0) {
  if (bytes === 0) return '0 bytes';

  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(0))} ${sizes[i]}`;
}

function formatSeconds(seconds = 0) {
  if (seconds === 0) return '0s';

  if (seconds < 0.001) {
    return `${(seconds * 1000000).toFixed(0)}μs`;
  }

  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }

  return `${seconds.toFixed(0)}s`;
}

function formatNumber(number = 0) {
  return number.toLocaleString();
}

type UsageProps = {
  func: ReturnType<typeof useFunction>['data'];
  timeframe: AnalyticsTimeframe;
};

const Usage = ({ func, timeframe }: UsageProps) => {
  const t = useScopedI18n('functions.overview');
  const { data: session } = useSession();
  const plan = getPlanFromPriceId({
    priceId: session?.organization?.stripePriceId,
    currentPeriodEnd: session?.organization?.stripeCurrentPeriodEnd,
  });
  const { data = [] } = useFunctionStats({ functionId: func?.id, timeframe });

  const requests = data.reduce((acc, { requests }) => acc + requests, 0);

  const cpuTimeAvg = useMemo(() => {
    let points = 0;

    const total = data.reduce((acc, { cpuTime }) => {
      points++;
      return acc + cpuTime;
    }, 0);

    // CPU time is in microseconds
    return points > 0 ? total / points / 1_000_000 : points;
  }, [data]);

  return (
    <>
      <Description title={t('usage')} total={formatNumber(plan.freeRequests)}>
        {formatNumber(requests)}
      </Description>
      <Description title={t('usage.avgCpu')} total={formatSeconds(plan.totalTimeout / 1000)}>
        {formatSeconds(cpuTimeAvg)}
      </Description>
      <Description title={t('usage.avgInBytes')}>
        {formatBytes(requests > 0 ? data.reduce((acc, { bytesIn }) => acc + bytesIn, 0) / requests : 0)}
      </Description>
      <Description title={t('usage.avgOutBytes')}>
        {formatBytes(requests > 0 ? data.reduce((acc, { bytesOut }) => acc + bytesOut, 0) / requests : 0)}
      </Description>
    </>
  );
};

type ChartsProps = {
  func: ReturnType<typeof useFunction>['data'];
  timeframe: AnalyticsTimeframe;
};

const Charts = ({ func, timeframe }: ChartsProps) => {
  const t = useScopedI18n('functions.overview');
  const { data = [] } = useFunctionStats({ functionId: func?.id, timeframe });

  const result = useMemo(() => {
    const timeframes: Record<AnalyticsTimeframe, number> = {
      'Last 24 hours': 24,
      'Last 30 days': 30,
      'Last 7 days': 7,
    };

    const values = [];

    for (let i = 0; i < timeframes[timeframe]; i++) {
      const now = new Date();
      now.setMinutes(0);

      if (timeframe === 'Last 24 hours') {
        now.setHours(now.getHours() - i);
      } else {
        now.setDate(now.getDate() - i);
      }

      const value = data.find(({ time: resultTime }) => {
        if (timeframe === 'Last 24 hours') {
          const resultTimeTZ = new Date(resultTime);
          resultTimeTZ.setTime(resultTimeTZ.getTime() - now.getTimezoneOffset() * 60 * 1000);

          return resultTimeTZ.getHours() === now.getHours();
        } else {
          return new Date(resultTime).getDate() === now.getDate();
        }
      });

      const time = now.getTime();

      values.push(value ? { ...value, time } : { time, requests: 0, cpuTime: 0, bytesIn: 0, bytesOut: 0 });
    }

    return values.sort((a, b) => a.time - b.time);
  }, [data, timeframe]);

  const labels = useMemo(() => result.map(({ time }) => new Date(time).getTime() / 1000), [result]);

  return (
    <>
      <Card title={t('requests')}>
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: t('requests.label'),
                color: '#3B82F6',
                data: result.map(({ requests }) => requests),
                transform: formatNumber,
              },
            ]}
          />
        </div>
      </Card>
      <Card title={t('cpuTime')}>
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: t('cpuTime.label'),
                color: '#F59E0B',
                // CPU time is in microseconds
                data: result.map(({ cpuTime }) => cpuTime / 1_000_000),
                transform: formatSeconds,
              },
            ]}
            axisTransform={(self, ticks) => ticks.map(formatSeconds)}
          />
        </div>
      </Card>
      <Card title={t('network')}>
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: t('network.label.inBytes'),
                color: '#10B981',
                data: result.map(({ bytesIn }) => bytesIn),
                transform: formatBytes,
              },
              {
                label: t('network.label.outBytes'),
                color: '#3B82F6',
                data: result.map(({ bytesOut }) => bytesOut),
                transform: formatBytes,
              },
            ]}
            axisTransform={(self, ticks) => ticks.map(formatBytes)}
          />
        </div>
      </Card>
    </>
  );
};

type FunctionOverviewProps = {
  func: ReturnType<typeof useFunction>['data'];
};

const FunctionOverview = ({ func }: FunctionOverviewProps) => {
  const router = useRouter();
  const t = useScopedI18n('functions.overview');
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(
    () => (router.query.timeframe as AnalyticsTimeframe) || 'Last 24 hours',
  );

  useEffect(() => {
    router.replace({
      query: {
        ...router.query,
        timeframe,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between">
        <Card
          title={t('usage')}
          fullWidth
          rightItem={
            <Menu>
              <Menu.Button>
                <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>{timeframe}</Button>
              </Menu.Button>
              <Menu.Items>
                {ANALYTICS_TIMEFRAMES.map(item => (
                  <Menu.Item key={item} disabled={timeframe === item} onClick={() => setTimeframe(item)}>
                    {item}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          }
        >
          <div className="flex flex-wrap justify-between gap-4">
            <Suspense
              fallback={
                <>
                  <Description title={t('usage.requests')}>
                    <Skeleton variant="text" />
                  </Description>
                  <Description title={t('usage.avgCpu')}>
                    <Skeleton variant="text" />
                  </Description>
                  <Description title={t('usage.avgInBytes')}>
                    <Skeleton variant="text" />
                  </Description>
                  <Description title={t('usage.avgOutBytes')}>
                    <Skeleton variant="text" />
                  </Description>
                </>
              }
            >
              <Usage func={func} timeframe={timeframe} />
            </Suspense>
          </div>
          <Divider />
          <div className="flex gap-8">
            <Text size="sm">
              {t('usage.lastUpdate')}&nbsp;
              {new Date(func?.updatedAt || Date.now()).toLocaleString('en-US', {
                minute: 'numeric',
                hour: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text size="sm">
              {t('usage.created')}&nbsp;
              {new Date(func?.createdAt || Date.now()).toLocaleString('en-US', {
                minute: 'numeric',
                hour: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </div>
        </Card>
      </div>
      <Suspense
        fallback={
          <>
            <Card title={t('requests')}>
              <div className="h-72">
                <Skeleton variant="card" />
              </div>
            </Card>
            <Card title={t('cpuTime')}>
              <div className="h-72">
                <Skeleton variant="card" />
              </div>
            </Card>
            <Card title={t('network')}>
              <div className="h-72">
                <Skeleton variant="card" />
              </div>
            </Card>
          </>
        }
      >
        <Charts func={func} timeframe={timeframe} />
      </Suspense>
    </div>
  );
};

export default FunctionOverview;
