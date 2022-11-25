import { ComponentProps, ReactElement, ReactNode } from 'react';
import Dot from './Dot';
import Text from './Text';

type LayoutTitleProps = {
  title: string;
  titleStatus?: ComponentProps<typeof Dot>['status'];
  rightItem?: ReactElement;
  children: ReactNode;
};

const LayoutTitle = ({ title, titleStatus, rightItem, children }: LayoutTitleProps) => {
  return (
    <div className="mx-auto px-4 md:max-w-4xl">
      <div className="flex justify-between items-center pt-10 mb-4">
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
