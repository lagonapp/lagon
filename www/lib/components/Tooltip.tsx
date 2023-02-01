import { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

type TooltipProps = {
  content: ReactNode;
  'aria-label': string;
  children: ReactNode;
};

export const Tooltip = ({ content, 'aria-label': ariaLabel, children }: TooltipProps) => {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger aria-label={ariaLabel}>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="bg-dark text-grey tooltip select-none rounded-md px-2 py-1 text-sm">
          {content}
          <RadixTooltip.Arrow />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
};
