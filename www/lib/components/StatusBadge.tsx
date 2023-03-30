import { Text } from './Text';

type Status = 'up' | 'incident' | 'outage' | 'maintenance';

const STATUS_TO_COLOR: Record<Status, string> = {
  up: 'bg-green',
  incident: 'bg-amber-500',
  outage: 'bg-red-500',
  maintenance: 'bg-blue-1',
};

const STATUS_TO_TEXT: Record<Status, string> = {
  up: 'All systems operational',
  incident: 'Incident identified',
  outage: 'Ongoing outage',
  maintenance: 'Under maintenance',
};

async function getStatus() {
  const res = await fetch(`https://status.lagon.app/status.json`, { next: { revalidate: 60 } });
  const data = await res.json();

  return data.indicator as Status;
}

export const StatusBadge = async () => {
  const status = await getStatus();

  return (
    <Text size="a" href="https://status.lagon.app" target="_blank">
      <i className={`mr-2 inline-block h-3 w-3 rounded-full ${STATUS_TO_COLOR[status]}`} />
      {STATUS_TO_TEXT[status]}
    </Text>
  );
};
