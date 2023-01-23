import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Button, Card, Description, Text } from '@lagon/ui';
import { trpc } from 'lib/trpc';
import { useI18n } from 'locales';
import { getPlanFromPriceId } from 'lib/plans';
import { useState } from 'react';
import useFunctions from 'lib/hooks/useFunctions';
import useFunctionsUsage from 'lib/hooks/useFunctionsUsage';

function formatNumber(number = 0) {
  return number.toLocaleString();
}

const SettingsBillingUsage = () => {
  const { data: session } = useSession();
  const organizationPlan = trpc.organizationPlan.useMutation();
  const organizationCheckout = trpc.organizationCheckout.useMutation();
  const functions = useFunctions();
  const usage = useFunctionsUsage({
    functions: functions.data?.map(func => func.id) ?? [],
  });
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const { scopedT } = useI18n();
  const t = scopedT('settings');

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

  const checkout = async (priceId: string) => {
    redirectStripe(async () => {
      const result = await organizationCheckout.mutateAsync({
        priceId,
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
        <div className="flex justify-between flex-wrap gap-4">
          <Description title="Total requests" total={formatNumber(plan.freeRequests)}>
            {formatNumber(Math.round(usage?.data ?? 0))}
          </Description>
          <Description title="Functions" total={plan.maxFunctions}>
            {functions.data?.length || 0}
          </Description>
          <Description title="Organization members" total={plan.organizationMembers}>
            1
          </Description>
        </div>
      </Card>
      <Card title={t('subcription.title')} description={t('subcription.description')}>
        <div className="flex justify-between">
          <div className="flex gap-1">
            <Text>Current plan:</Text>
            <Text strong>{t(`subcription.plan.${plan.type}`)}</Text>
          </div>
          {plan.type === 'personal' ? (
            <Button
              variant="primary"
              disabled={isLoadingPlan}
              onClick={() => checkout(process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID as string)}
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
              <Button variant="secondary" disabled={isLoadingPlan} onClick={managePlan}>
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
