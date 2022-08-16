import { useRouter } from 'next/router';
import { useCallback } from 'react';
import Card from 'lib/components/Card';
import Dot from 'lib/components/Dot';
import FunctionLinks from 'lib/components/FunctionLinks';
import Text from 'lib/components/Text';
import useFunctions from 'lib/hooks/useFunctions';
import EmptyState from 'lib/components/EmptyState';
import { useI18n } from 'locales';

const FunctionsList = () => {
  const { data: functions } = useFunctions();
  const { push } = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('home');

  const navigateToFunction = useCallback(
    (functionId: string) => {
      push(`/functions/${functionId}`);
    },
    [push],
  );

  return (
    <div className="flex gap-4 flex-col">
      {functions?.length === 0 ? <EmptyState title={t('empty.title')} description={t('empty.description')} /> : null}
      {functions?.map(func => (
        <Card key={func.id} clickable onClick={() => navigateToFunction(func.id)}>
          <div className="flex justify-between items-start whitespace-nowrap gap-4">
            <Text size="lg">
              <Dot status="success" />
              {func.name}
            </Text>
            <FunctionLinks func={func} />
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
