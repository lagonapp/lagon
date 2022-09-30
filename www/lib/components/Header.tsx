import Link from 'next/link';
import { HTMLAttributeAnchorTarget, ReactNode } from 'react';
import { DiscordIcon, GitHubIcon } from './Icons';

type HeaderLinkProps = {
  href: string;
  target?: HTMLAttributeAnchorTarget;
  soon?: boolean;
  children: ReactNode;
};

const HeaderLink = ({ href, target, soon, children }: HeaderLinkProps) => {
  return (
    <a
      href={href}
      target={target}
      className="text-sm text-gray-300 hover:text-white flex gap-1 items-center select-none transition"
    >
      {children}
      {soon ? <span className="text-xs text-gray-400">soon</span> : null}
    </a>
  );
};

const Header = () => {
  return (
    <header className="flex items-center justify-between max-w-4xl mx-auto mt-6 px-6 flex-col gap-2 md:flex-row md:gap-0">
      <Link href="/">
        <a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width="122" height="32" className="h-8" src="/logo-white.png" alt="Lagon logo" />
        </a>
      </Link>
      <div className="flex gap-8">
        <HeaderLink href="#" soon>
          Features
        </HeaderLink>
        <HeaderLink href="#" soon>
          Pricing
        </HeaderLink>
        <HeaderLink href="https://docs.lagon.app">Documentation</HeaderLink>
      </div>
      <div className="flex gap-8">
        <HeaderLink href="https://discord.lagon.app" target="_blank">
          <DiscordIcon />
          Discord
        </HeaderLink>
        <HeaderLink href="https://github.com/lagonapp/lagon" target="_blank">
          <GitHubIcon />
          GitHub
        </HeaderLink>
      </div>
    </header>
  );
};

export default Header;
