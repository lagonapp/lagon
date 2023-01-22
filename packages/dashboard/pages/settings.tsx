import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { composeValidators, maxLengthValidator, minLengthValidator, requiredValidator } from 'lib/form/validators';
import { useRouter } from 'next/router';
import { Button, Card, Form, Input, Dialog, Textarea, Text } from '@lagon/ui';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { trpc } from 'lib/trpc';
import { reloadSession } from 'lib/utils';
import LayoutTitle from 'lib/components/LayoutTitle';
import { getLocaleProps, useI18n } from 'locales';
import { GetStaticProps } from 'next';
import { useQueryClient } from '@tanstack/react-query';
import { getPlanFromPriceId } from 'lib/plans';
import { useState } from 'react';

const Settings = () => {
  const { data: session } = useSession();
  const deleteOrganization = trpc.organizationsDelete.useMutation();
  const updateOrganization = trpc.organizationUpdate.useMutation();
  const organizationPlan = trpc.organizationPlan.useMutation();
  const organizationCheckout = trpc.organizationCheckout.useMutation();
  const router = useRouter();
  const queryClient = useQueryClient();
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
    <LayoutTitle title={t('title')}>
      <div className="flex flex-col gap-8">
        <Form
          initialValues={{
            name: session?.organization.name,
          }}
          onSubmit={async ({ name }) => {
            await updateOrganization.mutateAsync({
              organizationId: session?.organization.id || '',
              name,
              description: session?.organization.description || null,
            });

            queryClient.refetchQueries();
            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success(t('name.success'));
          }}
        >
          <Card title={t('name.title')} description={t('name.description')}>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input
                name="name"
                placeholder={t('name.placeholder')}
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
                  maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                {t('name.submit')}
              </Button>
            </div>
          </Card>
        </Form>
        <Form
          initialValues={{
            description: session?.organization?.description,
          }}
          onSubmit={async ({ description }) => {
            await updateOrganization.mutateAsync({
              organizationId: session?.organization.id || '',
              name: session?.organization.name || '',
              description,
            });

            queryClient.refetchQueries();
            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success(t('description.success'));
          }}
        >
          <Card title={t('description.title')} description={t('description.description')}>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Textarea
                name="description"
                placeholder={t('description.placeholder')}
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                {t('description.submit')}
              </Button>
            </div>
          </Card>
        </Form>
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
        <Form
          onSubmit={async () => null}
          onSubmitSuccess={() => {
            toast.success(t('transfer.success'));
          }}
        >
          <Card title={t('transfer.title')} description={t('transfer.description')} danger>
            <div className="flex gap-1">
              <Text strong>{t('transfer.notAvailable')}</Text>
              <Text>{t('transfer.notAvailable.description')}</Text>
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input name="email" placeholder={t('transfer.placeholder')} disabled />
              <Button variant="danger" submit disabled>
                {t('transfer.submit')}
              </Button>
            </div>
          </Card>
        </Form>
        <Card title={t('delete.title')} description={t('delete.description')} danger>
          <div>
            <Dialog
              title={t('delete.modal.title')}
              description={t('delete.modal.description', {
                organizationName: session?.organization.name as string,
              })}
              disclosure={
                <Button variant="danger" disabled={deleteOrganization.isLoading}>
                  {t('delete.submit')}
                </Button>
              }
            >
              <Form
                onSubmit={() =>
                  deleteOrganization.mutateAsync({
                    organizationId: session?.organization.id || '',
                  })
                }
                onSubmitSuccess={() => {
                  toast.success(t('delete.success'));

                  queryClient.refetchQueries();
                  reloadSession();
                  router.push('/');
                }}
              >
                {({ handleSubmit }) => (
                  <>
                    <Input
                      name="confirm"
                      placeholder={session?.organization.name}
                      validator={value => (value !== session?.organization.name ? t('delete.modal.error') : undefined)}
                    />
                    <Dialog.Buttons>
                      <Dialog.Cancel disabled={deleteOrganization.isLoading} />
                      <Dialog.Action variant="danger" onClick={handleSubmit} disabled={deleteOrganization.isLoading}>
                        {t('delete.modal.submit')}
                      </Dialog.Action>
                    </Dialog.Buttons>
                  </>
                )}
              </Form>
            </Dialog>
          </div>
        </Card>
      </div>
    </LayoutTitle>
  );
};

Settings.title = 'Settings';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default Settings;
