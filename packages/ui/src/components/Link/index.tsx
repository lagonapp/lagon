import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import NextLink from 'next/link';
import { HTMLAttributeAnchorTarget } from 'react';
import { variants } from './styles';
import { VariantProps } from 'class-variance-authority';

type LinkProps = {
  href: string;
  target?: HTMLAttributeAnchorTarget;
  children: string;
} & VariantProps<typeof variants>;

export const Link = ({ href, target, inline, children }: LinkProps) => {
  const styles = variants({ inline });

  return (
    <NextLink href={href} target={target} className={styles}>
      {children}
      {target === '_blank' ? <ArrowTopRightOnSquareIcon className="h-4 w-4" /> : null}
    </NextLink>
  );
};
