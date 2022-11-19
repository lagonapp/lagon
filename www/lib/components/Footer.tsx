import Image from 'next/image';
import { ReactNode } from 'react';
import { Text } from './Text';

type FooterSectionProps = {
  title: string;
  children: ReactNode;
};

const FooterSection = ({ title, children }: FooterSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Text variant="bold">{title}</Text>
      {children}
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="container mx-auto flex justify-between py-16 px-8 mt-48">
      <div className="flex flex-col justify-between">
        <Image src="/logo-small-white.png" width="80" height="24" alt="Lagon Logo" />
        <Text>Copyright © {new Date().getFullYear()} Lagon</Text>
      </div>
      <div>Copyright</div>
      <div className="flex gap-32">
        <FooterSection title="Lagon">
          <Text size="a" href="#">
            CLI
          </Text>
          <Text size="a" href="#">
            Runtime
          </Text>
        </FooterSection>
        <FooterSection title="Product">
          <Text size="a" href="#">
            Features
          </Text>
          <Text size="a" href="#">
            Documentation
          </Text>
          <Text size="a" href="#">
            Pricing
          </Text>
        </FooterSection>
        <FooterSection title="Community">
          <Text size="a" href="https://github.com/lagonapp/lagon" target="_blank">
            GitHub
          </Text>
          <Text size="a" href="https://twitter.com/lagonapp" target="_blank">
            Twitter
          </Text>
          <Text size="a" href="https://discord.lagon/app" target="_blank">
            Discord
          </Text>
        </FooterSection>
      </div>
    </footer>
  );
};
