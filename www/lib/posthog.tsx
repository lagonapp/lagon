'use client';

import posthog from 'posthog-js';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  posthog.init('phc_PfiPF8GAEzXURYWu9VaNI4lm6wNHReHMQ93OQ1iHuZx', { api_host: 'https://app.posthog.com' });
}
