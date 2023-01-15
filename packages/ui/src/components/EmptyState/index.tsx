import Image from 'next/image';
import { ReactElement } from 'react';
import { Text } from '../';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactElement;
  image?: string;
};

export const EmptyState = ({ title, description, action, image }: EmptyStateProps) => {
  return (
    <div className="flex flex-col gap-8 text-center p-8 items-center">
      {image ? <Image src={image} alt="" width={150} height={150} /> : null}
      <div className="flex flex-col gap-2 max-w-[300px]">
        <Text size="xl">{title}</Text>
        <Text>{description}</Text>
      </div>
      {action}
    </div>
  );
};
