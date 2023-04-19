import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { composeValidators, maxLengthValidator, minLengthValidator, requiredValidator } from 'lib/form/validators';
import { useRouter } from 'next/router';
import { Button, Card, Form, Input, Dialog, Textarea } from '@lagon/ui';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { trpc } from 'lib/trpc';
import { reloadSession } from 'lib/utils';
import { useScopedI18n } from 'locales';
import { useQueryClient } from '@tanstack/react-query';
import useOrganizationMembers from 'lib/hooks/useOrganizationMembers';

const SettingsGeneral = () => {
  const { data: session } = useSession();
  const deleteOrganization = trpc.organizationsDelete.useMutation();
  const updateOrganization = trpc.organizationUpdate.useMutation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useScopedI18n('settings');
  const { data: organizationMembers } = useOrganizationMembers();

  const isOrganizationOwner = session?.user.id === organizationMembers?.owner.id;

  return (
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
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
            <Input
              name="name"
              placeholder={t('name.placeholder')}
              disabled={updateOrganization.isLoading || !isOrganizationOwner}
              validator={composeValidators(
                requiredValidator,
                minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
                maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
              )}
            />
            <Button variant="primary" disabled={updateOrganization.isLoading || !isOrganizationOwner} submit>
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
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
            <Textarea
              name="description"
              placeholder={t('description.placeholder')}
              disabled={updateOrganization.isLoading || !isOrganizationOwner}
              validator={composeValidators(requiredValidator, maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH))}
            />
            <Button variant="primary" disabled={updateOrganization.isLoading || !isOrganizationOwner} submit>
              {t('description.submit')}
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
              <Button variant="danger" disabled={deleteOrganization.isLoading || !isOrganizationOwner}>
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
  );
};

export default SettingsGeneral;
