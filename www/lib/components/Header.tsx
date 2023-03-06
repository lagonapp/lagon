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

  useEffect(() => {
    setOpen(false);
  }, [asPath]);

  return (
    <header className="bg-dark/50 container sticky top-0 z-50 mx-auto rounded-md py-4 px-8 backdrop-blur md:rounded-full">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Image src="/logo-small-white.png" width="80" height="24" alt="Lagon Logo" />
        </Link>
        <button className="px-4 md:hidden" onClick={() => setOpen(!open)} aria-label="Open menu">
          {open ? <CloseIcon /> : <BurgerIcon />}
        </button>
        <div className="hidden gap-12 md:flex">
          <Text size="a" href="/#features" scroll={false}>
            Features
          </Text>
          <Text size="a" href="https://docs.lagon.app" target="_blank">
            Documentation
          </Text>
          <Text size="a" href="/blog" className={asPath.startsWith('/blog') ? '!text-white' : undefined}>
            Blog
          </Text>
          <Text size="a" href="/pricing" className={asPath.startsWith('/pricing') ? '!text-white' : undefined}>
            Pricing
          </Text>
        </div>
        <div className="hidden gap-4 md:flex">
          <Button
            variant="tertiary"
            leftIcon={<GitHubIcon className="h-6 w-6 fill-current" />}
            href="https://github.com/lagonapp/lagon"
            target="_blank"
          >
            GitHub
          </Button>
          <Button variant="secondary" href="https://dash.lagon.app">
            Sign in
          </Button>
        </div>
      </div>
      {open ? (
        <div className="text-grey flex flex-col gap-4 pt-12 text-lg">
          <Link href="/#features" scroll={false}>
            Features
          </Link>
          <div className="border-b-grey/20 border-b" />
          <Link href="https://docs.lagon.app">Documentation</Link>
          <div className="border-b-grey/20 border-b" />
          <Link href="/blog" className={asPath.startsWith('/blog') ? '!text-white' : undefined}>
            Blog
          </Link>
          <div className="border-b-grey/20 border-b" />
          <Link href="/pricing" className={asPath.startsWith('/pricing') ? '!text-white' : undefined}>
            Pricing
          </Link>
          <div className="mt-6 flex justify-between gap-12">
            <Button
              variant="tertiary"
              leftIcon={<GitHubIcon className="h-6 w-6 fill-current" />}
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
