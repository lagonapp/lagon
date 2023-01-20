import { cva, VariantProps } from 'class-variance-authority';
import { MouseEventHandler } from 'react';

const style = cva(
  'bg-[#110C1F] rounded-t-md border border-b-0 border-[#413E4C] font-mono text-xs px-3 leading-normal transition hover:text-white',
  {
    variants: {
      selected: {
        true: 'text-white',
        false: 'text-grey',
      },
    },
  },
);

type CodeTabProps = {
  onClick: MouseEventHandler;
  children: string;
} & VariantProps<typeof style>;

export const CodeTab = ({ children, onClick, selected }: CodeTabProps) => {
  return (
    <button type="button" onClick={onClick} className={style({ selected })}>
      {children}
    </button>
  );
};
