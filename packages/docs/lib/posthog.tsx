import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

if (typeof window !== 'undefined' /* && process.env.NODE_ENV !== 'development'*/) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  });
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => posthog?.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <OriginalPostHogProvider client={posthog}>{children}</OriginalPostHogProvider>;
}
