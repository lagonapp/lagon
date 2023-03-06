import Image from 'next/image';
import { MDXProvider } from '@mdx-js/react';
import { Text } from '../components/Text';
import { ComponentProps, ReactNode } from 'react';
import { Article } from '../blog';
import { Tags } from '../components/Tags';
import Head from 'next/head';
import Link from 'next/link';

const components: ComponentProps<typeof MDXProvider>['components'] = {
  img: props => (
    <div className="relative h-[420px]">
      {/* @ts-expect-error src attribute is set by props */}
      <Image className="rounded-xl" fill {...props} />
    </div>
  ),
  // @ts-expect-error missing children
  h2: props => <Text size="h3" className="mt-8 mb-6" {...props} />,
  // @ts-expect-error missing children
  p: props => <Text className="mb-4 leading-7" {...props} />,
  // @ts-expect-error missing children
  a: props => <Text size="a" className="!text-blue-1 hover:underline" target="_blank" {...props} />,
  ul: props => <ul className="mb-4 pl-6" {...props} />,
  // @ts-expect-error missing children
  li: props => <Text size="li" {...props} />,
};

type BlogLayoutProps = {
  meta: Article['meta'];
  children: ReactNode;
};

export const BlogLayout = ({ meta, children }: BlogLayoutProps) => {
  return (
    <MDXProvider components={components}>
      <Head>
        <title>{`${meta.title} - Lagon Blog`}</title>
        <meta name="description" content={meta.description} />
      </Head>
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
    </MDXProvider>
  );
};
