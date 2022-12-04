import { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
};

export const Tooltip = ({ content, children }: TooltipProps) => {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="bg-dark text-sm px-2 py-1 rounded-md text-grey select-none tooltip">
          {content}
          <RadixTooltip.Arrow />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
};
