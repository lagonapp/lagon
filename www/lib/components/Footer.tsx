import Image from 'next/image';
import { ReactNode } from 'react';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';

type FooterSectionProps = {
  title: string;
  children: ReactNode;
};

const FooterSection = ({ title, children }: FooterSectionProps) => {
  return (
    <div className="flex flex-col gap-2 md:gap-4">
      <Text variant="bold">{title}</Text>
      {children}
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="container mx-auto mt-48 flex flex-col justify-between gap-12 py-16 px-8 lg:flex-row lg:gap-0">
      <div className="flex flex-col justify-between gap-4 md:gap-0">
        <Image src="/logo-white.png" width="80" height="24" alt="Lagon Logo" />
        <Text>Copyright © {new Date().getFullYear()} Lagon</Text>
      </div>
      <div className="flex flex-wrap justify-between gap-12 md:gap-32">
        <FooterSection title="Lagon">
          <Text size="a" href="https://docs.lagon.app/get-started" target="_blank">
            Get started
          </Text>
          <Text size="a" href="https://docs.lagon.app/cli" target="_blank">
            CLI
          </Text>
          <Text size="a" href="https://docs.lagon.app/runtime-apis" target="_blank">
            Runtime APIs
          </Text>
        </FooterSection>
        <FooterSection title="Product">
          <Text size="a" href="/#features" scroll={false}>
            Features
          </Text>
          <Text size="a" href="https://docs.lagon.app" target="_blank">
            Documentation
          </Text>
          <Text size="a" href="/blog">
            Blog
          </Text>
          <Text size="a" href="/pricing">
            Pricing
          </Text>
          <StatusBadge />
        </FooterSection>
        <FooterSection title="Community">
          <Text size="a" href="https://github.com/lagonapp/lagon" target="_blank" className="flex items-center gap-1">
            GitHub
          </Text>
          <Text size="a" href="https://twitter.com/lagonapp" target="_blank">
            Twitter
          </Text>
          <Text size="a" href="https://discord.lagon.dev" target="_blank">
            Discord
          </Text>
        </FooterSection>
      </div>
    </footer>
  );
};
