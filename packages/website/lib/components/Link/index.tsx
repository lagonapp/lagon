import { ExternalLinkIcon } from '@heroicons/react/outline';
import NextLink from 'next/link';
import { HTMLAttributeAnchorTarget } from 'react';

type LinkProps = {
  href: string;
  target?: HTMLAttributeAnchorTarget;
  children: string;
};

const Link = ({ href, target, children }: LinkProps) => {
  return (
    <NextLink href={href} target={target}>
      <a
        target="_blank"
        className="select-none text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 text-sm flex items-center gap-1 whitespace-nowrap"
      >
        {children}
        {target === '_blank' ? <ExternalLinkIcon className="w-4 h-4" /> : null}
      </a>
    </NextLink>
  );
};

export default Link;
