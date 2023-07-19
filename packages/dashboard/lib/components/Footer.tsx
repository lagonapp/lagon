import { ReactNode } from 'react';
import Link from 'next/link';
import packageJson from '../../package.json';
import { GitHubIcon } from './GitHubIcon';
import { TwitterIcon } from './TwitterIcon';
import { StatusBadge } from './StatusBadge';

type FooterLinkProps = {
  children: ReactNode;
  href: string;
};

const FooterLink = ({ children, href }: FooterLinkProps) => (
  <Link
    className="flex items-center gap-1 transition hover:text-stone-800 dark:hover:text-stone-200"
    href={href}
    target="_blank"
    rel="noreferrer"
  >
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="flex h-16 items-center justify-center border-t border-t-stone-200 bg-white text-sm text-stone-500 dark:border-t-stone-700 dark:bg-stone-900 dark:text-stone-400">
      <div className="flex w-full max-w-4xl items-center justify-center gap-8">
        <span>v{packageJson.version}</span>
        <StatusBadge />
        <FooterLink href="https://github.com/lagonapp/lagon">
          <GitHubIcon className="h-4" />
          GitHub
        </FooterLink>
        <FooterLink href="https://twitter.com/lagonapp">
          <TwitterIcon className="h-4" />
          Twitter
        </FooterLink>
      </div>
    </footer>
  );
};

export default Footer;
