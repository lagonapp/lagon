import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import FunctionLinks from 'lib/components/FunctionLinks';
import useFunctions from 'lib/hooks/useFunctions';
import { Card, Dot, Text, Button, EmptyState } from '@lagon/ui';
import { useScopedI18n } from 'locales';
import useFunction from 'lib/hooks/useFunction';

const FunctionsList = () => {
  const { data: functions } = useFunctions();
  const { push } = useRouter();
  const t = useScopedI18n('home');

  // Used to preload the function data
  const [hoveredFunctions, setHoveredFunctions] = useState<string[]>([]);
  const [hoverFunction, setHoverFunction] = useState<string | undefined>();
  useFunction(hoverFunction, false);

  const preloadFunction = (functionId: string) => {
    if (hoveredFunctions.includes(functionId)) return;

    setHoveredFunctions([...hoveredFunctions, functionId]);
    setHoverFunction(functionId);
  };

  const navigateToFunction = useCallback(
    (functionId: string) => {
      push(`/functions/${functionId}`);
    },
    [push],
  );

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation();
  };

  return (
    <div className="flex flex-col gap-4">
      {functions?.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          description={t('empty.description')}
          image="/images/functions-empty.png"
          action={
            <Button variant="primary" size="lg" href="https://docs.lagon.app/get-started" target="_blank">
              {t('empty.action')}
            </Button>
          }
        />
      ) : null}
      {functions?.map(func => (
        <Card
          key={func.id}
          clickable
          onClick={() => navigateToFunction(func.id)}
          onHover={() => preloadFunction(func.id)}
        >
          <div className="relative flex items-start justify-between gap-4 whitespace-nowrap">
            <Text size="lg">
              <Dot status="success" />
              {func.name}
            </Text>
            {func.cron === null ? (
              <FunctionLinks onClick={handleLinkClick} func={func} />
            ) : (
              <span className="text-sm text-blue-500">{t('list.cron')}</span>
            )}
          </div>
          <Text size="sm">
            {t('list.lastUpdate')}&nbsp;
            {new Date(func.updatedAt).toLocaleString('en-US', {
              minute: 'numeric',
              hour: 'numeric',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </Card>
      ))}
    </div>
  );
};

export default FunctionsList;
