import { ReactElement, ReactNode } from 'react';
import { VariantProps, cx } from 'class-variance-authority';
import { Text } from '../';
import { variants } from './styles';
import Link from 'next/link';

type CardProps = {
  title?: string;
  description?: ReactNode;
  rightItem?: ReactElement;
  fullWidth?: boolean;
  href?: string;
  children: ReactNode;
} & VariantProps<typeof variants>;

const CardContent = ({
  clickable,
  title,
  description,
  rightItem,
  fullWidth,
  danger,
  children,
}: Omit<CardProps, 'href'>) => {
  const styles = variants({ clickable, danger });

  return (
    <div className={cx([fullWidth && 'w-full', 'flex flex-col gap-2'])}>
      {title ? (
        <div className="flex items-end justify-between">
          <Text size="xl" strong>
            {title}
          </Text>
          {rightItem}
        </div>
      ) : null}
      <div className={styles}>
        {description ? <Text>{description}</Text> : null}
        {children}
      </div>
    </div>
  );
};

export const Card = ({ clickable, title, description, rightItem, fullWidth, danger, href, children }: CardProps) => {
  if (href) {
    return (
      <Link href={href}>
        <CardContent
          clickable={clickable}
          title={title}
          description={description}
          rightItem={rightItem}
          fullWidth={fullWidth}
          danger={danger}
        >
          {children}
        </CardContent>
      </Link>
    );
  }

  return (
    <CardContent
      clickable={clickable}
      title={title}
      description={description}
      rightItem={rightItem}
      fullWidth={fullWidth}
      danger={danger}
    >
      {children}
    </CardContent>
  );
};
