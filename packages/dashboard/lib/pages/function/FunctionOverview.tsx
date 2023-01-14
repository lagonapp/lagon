import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Chart, Description, Divider, Menu, Text } from '@lagon/ui';
import useFunctionStats from 'lib/hooks/useFunctionStats';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';
import { useI18n } from 'locales';

function formatBytes(bytes = 0) {
  if (bytes === 0) return '0 bytes';

  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatSeconds(seconds = 0) {
  if (seconds === 0) return '0s';

  if (seconds < 0.001) {
    return `${(seconds * 1000000).toFixed(2)}μs`;
  }

  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(2)}ms`;
  }

  return `${seconds.toFixed(2)}s`;
}

type FunctionOverviewProps = {
  func: ReturnType<typeof useFunction>['data'];
};

const FunctionOverview = ({ func }: FunctionOverviewProps) => {
  const router = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('functions.overview');
  const [timeframe, setTimeframe] = useState<Timeframe>(() => (router.query.timeframe as Timeframe) || 'Last 24 hours');
  const {
    requests: { data: requestsData = [] },
    cpuTime: { data: cpuTimeData = [] },
    bytesIn: { data: bytesInData = [] },
    bytesOut: { data: bytesOutData = [] },
    usage: { data: usageData = 0 },
  } = useFunctionStats({ functionId: func?.id, timeframe });

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
            <Description title={t('usage.requests')} total="100,000">
              {Math.round(usageData)}
            </Description>
            <Description title={t('usage.avgCpu')} total={`${func?.timeout || 0}ms`}>
              {formatSeconds(cpuTimeData.reduce((acc, { value }) => acc + value, 0) / cpuTimeData.length)}
            </Description>
            <Description title={t('usage.avgInBytes')}>
              {formatBytes(bytesInData.reduce((acc, { value }) => acc + value, 0) / bytesInData.length)}
            </Description>
            <Description title={t('usage.avgOutBytes')}>
              {formatBytes(bytesOutData.reduce((acc, { value }) => acc + value, 0) / bytesOutData.length)}
            </Description>
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
      <Card title={t('requests')}>
        <div className="h-72">
          <Chart
            labels={requestsData.map(({ time }) => time)}
            datasets={[
              {
                label: t('requests.label'),
                color: '#3B82F6',
                data: requestsData.map(({ value }) => Math.round(value)),
              },
            ]}
          />
        </div>
      </Card>
      <Card title={t('cpuTime')}>
        <div className="h-72">
          <Chart
            labels={cpuTimeData.map(({ time }) => time)}
            datasets={[
              {
                label: t('cpuTime.label'),
                color: '#F59E0B',
                data: cpuTimeData.map(({ value }) => value),
                transform: formatSeconds,
              },
            ]}
          />
        </div>
      </Card>
      <Card title={t('network')}>
        <div className="h-72">
          <Chart
            labels={bytesInData.map(({ time }) => time)}
            datasets={[
              {
                label: t('network.label.inBytes'),
                color: '#10B981',
                data: bytesInData.map(({ value }) => Math.round(value)),
                transform: formatBytes,
              },
              {
                label: t('network.label.outBytes'),
                color: '#3B82F6',
                data: bytesOutData.map(({ value }) => Math.round(value)),
                transform: formatBytes,
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default FunctionOverview;
