'use client';

import { useEffect, useState } from 'react';
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

export const StatusBadge = () => {
  const [status, setStatus] = useState<Status>('up');

  useEffect(() => {
    fetch('https://status.lagon.app/status.json')
      .then(res => res.json())
      .then(data => {
        setStatus(data.indicator);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <Text size="a" href="https://status.lagon.app" target="_blank">
      <i className={`mr-2 inline-block h-3 w-3 rounded-full ${STATUS_TO_COLOR[status]}`} />
      {STATUS_TO_TEXT[status]}
    </Text>
  );
};
