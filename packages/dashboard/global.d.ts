import 'next-auth';

declare module 'next-auth' {
  interface Session {
    organization: {
      id: string;
      name: string;
      description?: string;
      stripeCustomerId: string | null;
      stripePriceId: string | null;
      stripeSubscriptionId: string | null;
      stripeCurrentPeriodEnd: Date | null;
      createdAt: Date;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}
