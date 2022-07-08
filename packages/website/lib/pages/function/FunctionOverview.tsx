import { ChevronDownIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Chart from 'lib/components/Chart';
import Description from 'lib/components/Description';
import Divider from 'lib/components/Divider';
import Menu from 'lib/components/Menu';
import Text from 'lib/components/Text';
import useFunctionStats from 'lib/hooks/useFunctionStats';
import { Timeframe, TIMEFRAMES } from 'lib/types';
import useFunction from 'lib/hooks/useFunction';

function formatBytes(bytes: number): number {
  return parseFloat((bytes / 1000000).toFixed(2));
}

function formatKb(bytes: number): number {
  return parseFloat((bytes / 1000).toFixed(2));
}

function formatNs(ns: number): number {
  return parseFloat((ns / 1000000).toFixed(2));
}

type FunctionOverviewProps = {
  func: NonNullable<ReturnType<typeof useFunction>['data']>;
};

const FunctionOverview = ({ func }: FunctionOverviewProps) => {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>(() => (router.query.timeframe as Timeframe) || 'Last 24 hours');
  const { data: stats = [] } = useFunctionStats({ functionId: func.id, timeframe }) as {
    data: {
      createdAt: Date;
      memory: number;
      requests: number;
      cpuTime: number;
      receivedBytes: number;
      sendBytes: number;
    }[];
  };

  const { labels, values } = useMemo(() => {
    const result = {
      labels: [],
      values: [],
    } as {
      labels: string[];
      values: {
        requests: number;
        memory: number;
        cpu: number;
        receivedBytes: number;
        sendBytes: number;
      }[];
    };

    if (timeframe === 'Last 24 hours') {
      for (let i = 24 - 1; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i);

        result.labels.push(
          date.toLocaleString('en-US', {
            hour: 'numeric',
          }),
        );

        const stat = stats.filter(
          stat =>
            new Date(stat.createdAt).getHours() === date.getHours() &&
            new Date(stat.createdAt).getDate() === date.getDate(),
        );

        result.values.push({
          requests: stat.reduce((acc, current) => acc + current.requests, 0),
          memory: stat.reduce((acc, current) => acc + current.memory, 0) / stat.length || 0,
          cpu: stat.reduce((acc, current) => acc + current.cpuTime, 0) / stat.length || 0,
          receivedBytes: stat.reduce((acc, current) => acc + current.receivedBytes, 0) / stat.length || 0,
          sendBytes: stat.reduce((acc, current) => acc + current.sendBytes, 0) / stat.length || 0,
        });
      }
    } else {
      const daysInTimeframe = timeframe === 'Last 30 days' ? 30 : 7;

      for (let i = daysInTimeframe - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        result.labels.push(
          date.toLocaleString('en-US', {
            day: 'numeric',
            month: 'long',
          }),
        );

        const stat = stats.filter(
          stat =>
            new Date(stat.createdAt).getDate() === date.getDate() &&
            new Date(stat.createdAt).getMonth() === date.getMonth(),
        );

        result.values.push({
          requests: stat.reduce((acc, current) => acc + current.requests, 0),
          memory: stat.reduce((acc, current) => acc + current.memory, 0) / stat.length || 0,
          cpu: stat.reduce((acc, current) => acc + current.cpuTime, 0) / stat.length || 0,
          receivedBytes: stat.reduce((acc, current) => acc + current.receivedBytes, 0) / stat.length || 0,
          sendBytes: stat.reduce((acc, current) => acc + current.sendBytes, 0) / stat.length || 0,
        });
      }
    }

    return result;
  }, [stats, timeframe]);

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
          title="Usage & Limits"
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
            <Description title="Requests" total="100,000">
              {stats.reduce((acc, current) => acc + current.requests, 0)}
            </Description>
            <Description title="CPU time" total={`${func.timeout}ms`}>
              {stats.length > 0 ? formatNs(stats.reduce((acc, current) => acc + current.cpuTime, 0) / stats.length) : 0}
              ms
            </Description>
            <Description title="Memory" total={`${func.memory} MB`}>
              {stats.length > 0
                ? formatBytes(stats.reduce((acc, current) => acc + current.memory, 0) / stats.length)
                : 0}
              &nbsp;MB
            </Description>
            <Description title="Received bytes">
              {stats.length > 0
                ? formatKb(
                    stats.reduce((acc, current) => acc + current.receivedBytes, 0) /
                      stats.reduce((acc, current) => acc + current.requests, 0),
                  )
                : 0}
              &nbsp;KB
            </Description>
            <Description title="Send bytes">
              {stats.length > 0
                ? formatKb(
                    stats.reduce((acc, current) => acc + current.sendBytes, 0) /
                      stats.reduce((acc, current) => acc + current.requests, 0),
                  )
                : 0}
              &nbsp;KB
            </Description>
          </div>
          <Divider />
          <div className="flex gap-8">
            <Text size="sm">
              Last update:&nbsp;
              {new Date(func.createdAt).toLocaleString('en-US', {
                minute: 'numeric',
                hour: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text size="sm">
              Created:&nbsp;
              {new Date(func.createdAt).toLocaleString('en-US', {
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
      <Card title="Requests">
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: 'Requests',
                color: '#3B82F6',
                data: values.map(({ requests }) => requests),
              },
            ]}
          />
        </div>
      </Card>
      <Card title="Resources">
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: 'CPU',
                color: '#F59E0B',
                data: values.map(({ cpu }) => formatNs(cpu)),
              },
              {
                label: 'Memory',
                color: '#EF4444',
                data: values.map(({ memory }) => formatBytes(memory)),
              },
            ]}
          />
        </div>
      </Card>
      <Card title="Network">
        <div className="h-72">
          <Chart
            labels={labels}
            datasets={[
              {
                label: 'Received bytes',
                color: '#10B981',
                data: values.map(({ receivedBytes }) => receivedBytes),
              },
              {
                label: 'Send bytes',
                color: '#3B82F6',
                data: values.map(({ sendBytes }) => sendBytes),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
};

export default FunctionOverview;
