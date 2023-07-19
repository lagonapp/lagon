import { useEffect, useState } from 'react';

type Status = 'up' | 'incident' | 'outage' | 'maintenance';

const STATUS_TO_COLOR: Record<Status, string> = {
  up: 'bg-green-400 dark:bg-green-600',
  incident: 'bg-amber-400 dark:bg-amber-600',
  outage: 'bg-red-400 dark:bg-red-600',
  maintenance: 'bg-blue-500',
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
    <a
      href="https://status.lagon.app"
      target="_blank"
      className="mr-auto flex items-center gap-2 transition hover:text-stone-800 dark:hover:text-stone-200"
    >
      <i className={`inline-block h-3 w-3 rounded-full ${STATUS_TO_COLOR[status]}`} />
      {STATUS_TO_TEXT[status]}
    </a>
  );
};
