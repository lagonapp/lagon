import { Button } from './Button';
import { Text } from './Text';
import Image from 'next/image';
import Link from 'next/link';
import { GitHubIcon } from './icons/GitHubIcon';
import { BurgerIcon } from './icons/BurgerIcon';
import { useEffect, useState } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { useRouter } from 'next/router';

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { asPath } = useRouter();
  const [pricing, setPricing] = useState(false);

  useEffect(() => {
    setOpen(false);

    setPricing(asPath === '/pricing');
  }, [asPath]);

  return (
<<<<<<< HEAD
    <header className="container sticky top-0 mx-auto bg-dark/50 backdrop-blur py-4 px-8 z-50">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Image src="/logo-small-white.png" width="80" height="24" alt="Lagon Logo" />
        </Link>
        <button className="md:hidden px-4" onClick={() => setOpen(!open)} aria-label="Open menu">
          {open ? <CloseIcon /> : <BurgerIcon />}
        </button>
        <div className="gap-12 hidden md:flex">
          <Text size="a" href="/#features" scroll={false}>
            Features
          </Text>
          <Text size="a" href="https://docs.lagon.app">
            Documentation
          </Text>
          <Text size="a" href="/pricing" className={pricing ? '!text-white' : undefined}>
            Pricing
          </Text>
        </div>
        <div className="gap-4 hidden md:flex">
          <Button
            variant="tertiary"
            leftIcon={<GitHubIcon className="w-6 h-6 fill-current" />}
            href="https://github.com/lagonapp/lagon"
            target="_blank"
          >
            GitHub
          </Button>
          <Button variant="secondary" href="https://dash.lagon.app">
            Sign in
          </Button>
        </div>
=======
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
>>>>>>> main
      </div>
      {open ? (
        <div className="flex flex-col gap-4 text-lg text-grey pt-12">
          <Link href="/#features" scroll={false}>
            Features
          </Link>
          <div className="border-b border-b-grey/20" />
          <Link href="https://docs.lagon.app">Documentation</Link>
          <div className="border-b border-b-grey/20" />
          <Link href="/pricing" className={pricing ? '!text-white' : undefined}>
            Pricing
          </Link>
          <div className="flex gap-12 justify-between mt-6">
            <Button
              variant="tertiary"
              leftIcon={<GitHubIcon className="w-6 h-6 fill-current" />}
              href="https://github.com/lagonapp/lagon"
              target="_blank"
              className="flex-1"
            >
              GitHub
            </Button>
            <Button variant="secondary" href="https://dash.lagon.app" className="flex-1">
              Sign in
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
};
