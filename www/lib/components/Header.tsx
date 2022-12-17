import { Button } from './Button';
import { Text } from './Text';
import Image from 'next/image';
import Link from 'next/link';
import { GitHubIcon } from './icons/GitHubIcon';

export const Header = () => {
  return (
    <header className="container sticky top-0 mx-auto flex items-center justify-between bg-dark/50 backdrop-blur py-4 px-8 rounded-full z-10">
      <Link href="/">
        <Image src="/logo-small-white.png" width="80" height="24" alt="Lagon Logo" />
      </Link>
      <div className="flex gap-12">
        <Text size="a" href="/#features" scroll={false}>
          Features
        </Text>
        <Text size="a" href="https://docs.lagon.app">
          Documentation
        </Text>
        <Text size="a" href="/pricing">
          Pricing
        </Text>
      </div>
      <div className="flex gap-4">
        <Button
          variant="tertiary"
          leftIcon={<GitHubIcon className="w-6 h-6 fill-current" />}
          href="https://github.com/lagonapp/lagon"
        >
          GitHub
        </Button>
        <Button variant="secondary" href="https://dash.lagon.app">
          Sign in
        </Button>
      </div>
    </header>
  );
};
