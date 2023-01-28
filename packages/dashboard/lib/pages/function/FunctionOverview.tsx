import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { Suspense, useEffect, useState } from 'react';
import { Button, Card, Chart, Description, Divider, Menu, Skeleton, Text } from '@lagon/ui';
import useFunctionStats from 'lib/hooks/useFunctionStats';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useI18n } from 'locales';
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
  timeframe: Timeframe;
};

const Usage = ({ func, timeframe }: UsageProps) => {
  const { scopedT } = useI18n();
  const t = scopedT('functions.overview');
  const { data: session } = useSession();
  const plan = getPlanFromPriceId({
    priceId: session?.organization?.stripePriceId,
    currentPeriodEnd: session?.organization?.stripeCurrentPeriodEnd,
  });
  const {
    data: { usage, cpuTime, bytesIn, bytesOut } = {
      usage: 0,
      requests: [],
      cpuTime: [],
      bytesIn: [],
      bytesOut: [],
    },
  } = useFunctionStats({ functionId: func?.id, timeframe });

  return (
    <>
      <Description title={t('usage')} total={formatNumber(plan.freeRequests)}>
        {formatNumber(Math.round(usage))}
      </Description>
      <Description title={t('usage.avgCpu')} total={`${plan.cpuTime}ms`}>
        {formatSeconds(cpuTime.length === 0 ? 0 : cpuTime.reduce((acc, { value }) => acc + value, 0) / cpuTime.length)}
      </Description>
      <Description title={t('usage.avgInBytes')}>
        {formatBytes(bytesIn.length === 0 ? 0 : bytesIn.reduce((acc, { value }) => acc + value, 0) / bytesIn.length)}
      </Description>
      <Description title={t('usage.avgOutBytes')}>
        {formatBytes(bytesOut.length === 0 ? 0 : bytesOut.reduce((acc, { value }) => acc + value, 0) / bytesOut.length)}
      </Description>
    </>
  );
};

type ChartsProps = {
  func: ReturnType<typeof useFunction>['data'];
  timeframe: Timeframe;
};

const Charts = ({ func, timeframe }: ChartsProps) => {
  const { scopedT } = useI18n();
  const t = scopedT('functions.overview');
  const {
    data: { requests, cpuTime, bytesIn, bytesOut } = {
      requests: [],
      cpuTime: [],
      bytesIn: [],
      bytesOut: [],
    },
  } = useFunctionStats({ functionId: func?.id, timeframe });

  return (
    <>
      <Card title={t('requests')}>
        <div className="h-72">
          <Chart
            labels={requests.map(({ time }) => time)}
            datasets={[
              {
                label: t('requests.label'),
                color: '#3B82F6',
                data: requests.map(({ value }) => Math.round(value)),
                transform: formatNumber,
              },
            ]}
          />
        </div>
      </Card>
      <Card title={t('cpuTime')}>
        <div className="h-72">
          <Chart
            labels={cpuTime.map(({ time }) => time)}
            datasets={[
              {
                label: t('cpuTime.label'),
                color: '#F59E0B',
                data: cpuTime.map(({ value }) => value),
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
            labels={bytesIn.map(({ time }) => time)}
            datasets={[
              {
                label: t('network.label.inBytes'),
                color: '#10B981',
                data: bytesIn.map(({ value }) => Math.round(value)),
                transform: formatBytes,
              },
              {
                label: t('network.label.outBytes'),
                color: '#3B82F6',
                data: bytesOut.map(({ value }) => Math.round(value)),
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
  const { scopedT } = useI18n();
  const t = scopedT('functions.overview');
  const [timeframe, setTimeframe] = useState<Timeframe>(() => (router.query.timeframe as Timeframe) || 'Last 24 hours');

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
          }
        >
          <div className="flex justify-between flex-wrap gap-4">
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
