import { MouseEventHandler, ReactElement, ReactNode } from 'react';
import { VariantProps, cx } from 'class-variance-authority';
import { Text } from '../';
import { variants } from './styles';

type CardProps = {
  title?: string;
  description?: string;
  rightItem?: ReactElement;
  fullWidth?: boolean;
  onClick?: MouseEventHandler;
  onHover?: MouseEventHandler;
  children: ReactNode;
} & VariantProps<typeof variants>;

export const Card = ({
  clickable,
  title,
  description,
  rightItem,
  fullWidth,
  onClick,
  onHover,
  danger,
  children,
}: CardProps) => {
  const styles = variants({ clickable, danger });

  return (
    <div className={cx([fullWidth ? 'w-full' : '', 'flex flex-col gap-2'])}>
      {title ? (
        <div className="flex items-end justify-between">
          <Text size="xl" strong>
            {title}
          </Text>
          {rightItem}
        </div>
      ) : null}
      <div onClick={onClick} onMouseEnter={onHover} className={styles}>
        {description ? <Text>{description}</Text> : null}
        {children}
      </div>
    </div>
  );
};
