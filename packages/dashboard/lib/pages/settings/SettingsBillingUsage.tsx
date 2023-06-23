import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Banner, Button, Card, Description, Skeleton, Text } from '@lagon/ui';
import { trpc } from 'lib/trpc';
import { useScopedI18n } from 'locales';
import { getPlanFromPriceId } from 'lib/plans';
import { Suspense, useState } from 'react';
import useFunctions from 'lib/hooks/useFunctions';
import useFunctionsUsage from 'lib/hooks/useFunctionsUsage';
import useOrganizationMembers from 'lib/hooks/useOrganizationMembers';
import { useRouter } from 'next/router';

function formatNumber(number = 0) {
  return number.toLocaleString();
}

const Requests = () => {
  const { data: session } = useSession();
  const plan = getPlanFromPriceId({
    priceId: session?.organization?.stripePriceId,
    currentPeriodEnd: session?.organization?.stripeCurrentPeriodEnd,
  });
  const functions = useFunctions();
  const usage = useFunctionsUsage({
    functions: functions.data?.map(func => func.id) ?? [],
  });
  const t = useScopedI18n('settings');

  return (
    <Description title={t('usage.requests')} total={formatNumber(plan.freeRequests)}>
      {formatNumber(Math.round(usage?.data ?? 0))}
    </Description>
  );
};

const Functions = () => {
  const { data: session } = useSession();
  const plan = getPlanFromPriceId({
    priceId: session?.organization?.stripePriceId,
    currentPeriodEnd: session?.organization?.stripeCurrentPeriodEnd,
  });
  const functions = useFunctions();
  const t = useScopedI18n('settings');

  return (
    <Description title={t('usage.functions')} total={plan.maxFunctions}>
      {functions.data?.length || 0}
    </Description>
  );
};

const SettingsBillingUsage = () => {
  const { data: session } = useSession();
  const organizationPlan = trpc.organizationPlan.useMutation();
  const organizationCheckout = trpc.organizationCheckout.useMutation();
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const t = useScopedI18n('settings');
  const { data: organizationMembers } = useOrganizationMembers();
  const { query } = useRouter()

  const hasPlanUpdateSucceeded = !!query.updateSucceeded
  const hasPlanUpdateFailed = !!query.updateFailed
  const isOrganizationOwner = session?.user.id === organizationMembers?.owner.id;

  const redirectStripe = async (action: () => Promise<string | undefined | null>) => {
    setIsLoadingPlan(true);
    const url = await action();
    setIsLoadingPlan(false);

    if (url) {
      window.location.href = url;
    } else {
      toast.error('Something went wrong');
    }
  };

  const checkout = async (priceId: string, priceIdMetered: string) => {
    redirectStripe(async () => {
      const result = await organizationCheckout.mutateAsync({
        priceId,
        priceIdMetered,
      });

      return result.url;
    });
  };

  const managePlan = async () => {
    redirectStripe(async () => {
      const result = await organizationPlan.mutateAsync({
        stripeCustomerId: session?.organization?.stripeCustomerId || '',
      });

      return result.url;
    });
  };

  const plan = getPlanFromPriceId({
    priceId: session?.organization?.stripePriceId,
    currentPeriodEnd: session?.organization?.stripeCurrentPeriodEnd,
  });

  return (
    <div className="flex flex-col gap-8">
      <Card title={t('usage.title')} description={t('usage.description')}>
        <div className="flex flex-wrap justify-between gap-4">
          <Suspense
            fallback={
              <Description title={t('usage.requests')}>
                <Skeleton variant="text" />
              </Description>
            }
          >
            <Requests />
          </Suspense>
          <Suspense
            fallback={
              <Description title={t('usage.functions')}>
                <Skeleton variant="text" />
              </Description>
            }
          >
            <Functions />
          </Suspense>
          <Description title={t('usage.members')} total={plan.organizationMembers}>
            {/* We add 1 because the owner isn't listed in the organization members */}
            {(organizationMembers?.members.length ?? 0) + 1}
          </Description>
        </div>
      </Card>
      <Card title={t('subcription.title')} description={t('subcription.description')}>
        {hasPlanUpdateSucceeded ? (
          <Banner variant="success">
            {t('subscription.updateSuccess')}
          </Banner>
        ) : hasPlanUpdateFailed ? (
          <Banner variant="error">
            {t('subscription.updateFail')}
          </Banner>
        ) : null}
        <div className="flex justify-between">
          <div className="flex gap-1 items-center">
            <Text>Current plan:</Text>
            <Text strong>{t(`subcription.plan.${plan.type}`)}</Text>
          </div>
          {plan.type === 'personal' ? (
            <Button
              variant="primary"
              disabled={isLoadingPlan || !isOrganizationOwner}
              onClick={() =>
                checkout(
                  process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID as string,
                  process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID_METERED as string,
                )
              }
            >
              {t('subcription.upgrade.pro')}
            </Button>
          ) : (
            <>
              <Text>
                {t('subcription.renew', {
                  date: new Date(session?.organization?.stripeCurrentPeriodEnd ?? 0).toLocaleDateString(),
                })}
              </Text>
              <Button variant="secondary" disabled={isLoadingPlan || !isOrganizationOwner} onClick={managePlan}>
                {t('subcription.manage')}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SettingsBillingUsage;
