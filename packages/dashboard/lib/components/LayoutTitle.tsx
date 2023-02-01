import { ComponentProps, ReactElement, ReactNode } from 'react';
import { Dot, Text } from '@lagon/ui';

type LayoutTitleProps = {
  title: string;
  titleStatus?: ComponentProps<typeof Dot>['status'];
  rightItem?: ReactElement;
  children: ReactNode;
};

const LayoutTitle = ({ title, titleStatus, rightItem, children }: LayoutTitleProps) => {
  return (
    <div className="mx-auto px-4 pb-12 md:max-w-4xl">
      <div className="mb-4 flex items-center justify-between pt-10">
        <Text size="2xl">
          {titleStatus ? <Dot status={titleStatus} /> : null}
          {title}
        </Text>
        {rightItem}
      </div>
      {children}
    </div>
  );
};

export default LayoutTitle;
