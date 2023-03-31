import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Tags } from '../../../lib/components/Tags';
import { Text } from '../../../lib/components/Text';
// @ts-expect-error MDX
import { meta } from './page.mdx';

export const metadata = {
  title: `${meta.title} - Lagon`,
  description: meta.description,
};

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="z-10 mx-auto flex max-w-2xl flex-col">
      <div className="mb-16 flex flex-col gap-8">
        <Text size="h2">{meta.title}</Text>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src={meta.author.avatar}
              width={32}
              height={32}
              alt={`${meta.author.name}'s avatar`}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex flex-col">
              <Text variant="bold" className="text-sm">
                {meta.author.name}&nbsp;
                <Link
                  href={`https://twitter.com/${meta.author.handle}`}
                  target="_blank"
                  className="text-grey font-normal"
                >
                  @{meta.author.handle}
                </Link>
              </Text>
              <Text className="text-sm">{meta.author.bio}</Text>
            </div>
          </div>
          <div className="flex flex-col justify-end md:items-end">
            <Tags tags={meta.tags} />
            <Text className="text-sm">{meta.date}</Text>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
