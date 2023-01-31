import Image from 'next/image';
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
      className="flex select-none items-center gap-1 text-sm text-gray-300 transition hover:text-white"
    >
      {children}
      {soon ? <span className="text-xs text-gray-400">soon</span> : null}
    </a>
  );
};

const Header = () => {
  return (
    <header className="mx-auto mt-6 flex max-w-4xl flex-col items-center justify-between gap-2 px-6 md:flex-row md:gap-0">
      <Link href="/">
        <Image width="105" height="32" className="h-8" src="/logo-white.png" alt="Lagon logo" />
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
