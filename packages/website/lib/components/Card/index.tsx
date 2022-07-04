import { MouseEventHandler, ReactElement, ReactNode } from 'react';
import Text from 'lib/components/Text';
import useTailwind from 'lib/hooks/useTailwind';

type CardProps = {
  clickable?: boolean;
  title?: string;
  description?: string;
  rightItem?: ReactElement;
  fullWidth?: boolean;
  onClick?: MouseEventHandler;
  danger?: boolean;
  children: ReactNode;
};

const Card = ({ clickable, title, description, rightItem, fullWidth, onClick, danger, children }: CardProps) => {
  const styles = useTailwind(
    {
      clickable,
      danger,
    },
    {
      clickable: 'cursor-pointer hover:shadow-stone-300 dark:hover:shadow-stone-700',
      danger: 'border border-red-500',
    },
  );
  return (
    <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-2`}>
      {title ? (
        <div className="flex items-end justify-between">
          <Text size="xl" strong>
            {title}
          </Text>
          {rightItem}
        </div>
      ) : null}
      <div
        onClick={onClick}
        className={`${styles} p-4 rounded-md bg-white dark:bg-stone-900 shadow-md shadow-stone-200 dark:shadow-stone-800 transition flex flex-col gap-4`}
      >
        {description ? <Text>{description}</Text> : null}
        {children}
      </div>
    </div>
  );
};

export default Card;
