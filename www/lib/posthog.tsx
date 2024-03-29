'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog?.capture('$pageview');
  }, [pathname, searchParams]);

  return <OriginalPostHogProvider client={posthog}>{children}</OriginalPostHogProvider>;
}
