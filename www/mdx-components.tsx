import type { MDXProvider } from '@mdx-js/react';
import Image from 'next/image';
import { ComponentProps } from 'react';
import { Text } from './lib/components/Text';

type MDXComponents = ComponentProps<typeof MDXProvider>['components'];

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => <h1 style={{ fontSize: "100px" }}>{children}</h1>,
    ...components,
    img: props => (
      <div className="relative h-[420px]">
        {/* @ts-expect-error src attribute is set by props */}
        <Image className="rounded-xl" fill {...props} />
      </div>
    ),
    // @ts-expect-error missing children
    h2: props => <Text size="h3" className="mb-6 mt-8 text-white" {...props} />,
    // @ts-expect-error missing children
    p: props => <Text className="mb-4 leading-7" {...props} />,
    // @ts-expect-error missing children
    a: props => <Text size="a" className="!text-blue-1 hover:underline" target="_blank" {...props} />,
    ul: props => <ul className="mb-4 pl-6" {...props} />,
    // @ts-expect-error missing children
    li: props => <Text size="li" {...props} />,
  };
}
