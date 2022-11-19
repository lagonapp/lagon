import { Button } from './Button';
import { Text } from './Text';
import Image from 'next/image';

export const Header = () => {
  return (
    <header className="container sticky top-0 mx-auto flex items-center justify-between bg-dark/50 backdrop-blur py-4 px-8 rounded-full z-10">
      <Image src="/logo-small-white.png" width="80" height="24" alt="Lagon Logo" />
      <div className="flex gap-12">
        <Text size="a" href="#">
          Features
        </Text>
        <Text size="a" href="#">
          Docs
        </Text>
        <Text size="a" href="#">
          Pricing
        </Text>
        <Text size="a" href="#">
          Community
        </Text>
      </div>
      <div className="flex gap-4">
        <Button variant="tertiary">Get started</Button>
        <Button variant="secondary">Sign in</Button>
      </div>
    </header>
  );
};
