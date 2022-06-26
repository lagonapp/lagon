import { useRouter } from 'next/router';
import { useCallback } from 'react';
import Card from 'lib/components/Card';
import Dot from 'lib/components/Dot';
import FunctionLinks from 'lib/components/FunctionLinks';
import Text from 'lib/components/Text';
import useFunctions from 'lib/hooks/useFunctions';
import EmptyState from 'lib/components/EmptyState';

const FunctionsList = () => {
  const { data: functions } = useFunctions();
  const { push } = useRouter();

  const navigateToFunction = useCallback(
    functionId => {
      push(`/functions/${functionId}`);
    },
    [push],
  );

  return (
    <div className="flex gap-4 flex-col">
      {functions.length === 0 ? (
        <EmptyState
          title="No Functions found"
          description="Start by creating a new Function by clicking the button in the right corner."
        />
      ) : null}
      {functions.map(func => (
        <Card key={func.id} clickable onClick={() => navigateToFunction(func.id)}>
          <div className="flex justify-between items-start">
            <Text size="lg">
              <Dot status="success" />
              {func.name}
            </Text>
            <FunctionLinks func={func} />
          </div>
          <Text>
            Last deployed:{' '}
            {new Date(func.updatedAt).toLocaleString('en-US', {
              minute: '2-digit',
              hour: '2-digit',
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Card>
      ))}
    </div>
  );
};

export default FunctionsList;
