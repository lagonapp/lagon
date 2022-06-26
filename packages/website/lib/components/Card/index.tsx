import { MouseEventHandler, ReactElement, ReactNode } from 'react';
import Text from 'lib/components/Text';

type CardProps = {
  clickable?: boolean;
  title?: string;
  description?: string;
  rightItem?: ReactElement;
  fullWidth?: boolean;
  onClick?: MouseEventHandler;
  children: ReactNode;
};

const Card = ({ clickable, title, description, rightItem, fullWidth, onClick, children }: CardProps) => {
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
        className={`${
          clickable ? 'cursor-pointer hover:shadow-stone-300' : ''
        } p-4 rounded-md bg-white shadow-md shadow-stone-200 transition flex flex-col gap-6`}
      >
        {description ? <Text>{description}</Text> : null}
        {children}
      </div>
    </div>
  );
};

export default Card;
