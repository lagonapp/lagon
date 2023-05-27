import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import NextLink from 'next/link';
import { HTMLAttributeAnchorTarget } from 'react';

type LinkProps = {
  href: string;
  target?: HTMLAttributeAnchorTarget;
  children: string;
};

export const Link = ({ href, target, children }: LinkProps) => {
  return (
    <NextLink
      href={href}
      target={target}
      className="flex items-center gap-1 whitespace-nowrap text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500"
    >
      {children}
      {target === '_blank' ? <ArrowTopRightOnSquareIcon className="h-4 w-4" /> : null}
    </NextLink>
  );
};
