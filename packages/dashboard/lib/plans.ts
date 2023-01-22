export type Plan = {
  type: 'personal' | 'pro';
  id?: string;
  expired: boolean;
  maxFunctions: number;
  freeRequests: number;
  cpuTime: number;
  startupTime: number;
};

export const PERSONAL_PLAN: Plan = {
  type: 'personal',
  expired: false,
  maxFunctions: 10,
  freeRequests: 3000000,
  cpuTime: 10,
  startupTime: 100,
};

export const PRO_PLAN: Plan = {
  type: 'pro',
  id: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID,
  expired: false,
  maxFunctions: 50,
  freeRequests: 5000000,
  cpuTime: 50,
  startupTime: 200,
};

export const getPlanFromPriceId = ({
  priceId,
  currentPeriodEnd,
}: {
  priceId?: string | null;
  currentPeriodEnd?: Date | null;
}) => {
  if (priceId === PRO_PLAN.id) {
    return {
      ...PRO_PLAN,
      expired: new Date(currentPeriodEnd ?? 0).getTime() < Date.now(),
    };
  }

  return PERSONAL_PLAN;
};
