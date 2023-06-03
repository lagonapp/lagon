import FunctionLinks from 'lib/components/FunctionLinks';
import useFunctions from 'lib/hooks/useFunctions';
import { Card, Dot, Text, Button, EmptyState } from '@lagon/ui';
import { useScopedI18n } from 'locales';
import cronstrue from 'cronstrue';

const FunctionsList = () => {
  const { data: functions } = useFunctions();
  const t = useScopedI18n('home');

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
        <Card key={func.id} clickable href={`/functions/${func.id}`}>
          <div className="relative flex items-start justify-between gap-4 whitespace-nowrap">
            <Text size="lg">
              <Dot status="success" />
              {func.name}
            </Text>
            {func.cron === null ? (
              <FunctionLinks onClick={handleLinkClick} func={func} />
            ) : (
              <span className="text-sm text-blue-500">{cronstrue.toString(func.cron)}</span>
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
