import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import { composeValidators, maxLengthValidator, minLengthValidator, requiredValidator } from 'lib/form/validators';
import Dialog from 'lib/components/Dialog';
import { useRouter } from 'next/router';
import Textarea from 'lib/components/Textarea';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { trpc } from 'lib/trpc';
import { reloadSession } from 'lib/utils';
import LayoutTitle from 'lib/components/LayoutTitle';
import { useI18n } from 'locales';

const Settings = () => {
  const { data: session } = useSession();
  const updateOrganization = trpc.useMutation(['organizations.update']);
  const deleteOrganization = trpc.useMutation(['organizations.delete']);
  const router = useRouter();
  const queryContext = trpc.useContext();
  const t = useI18n();

  return (
    <LayoutTitle title="Settings">
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

            queryContext.refetchQueries();
            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success('Organization name updated successfully.');
          }}
        >
          <Card title={t('settings.name.title')} description={t('settings.name.description')}>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input
                name="name"
                placeholder={t('settings.name.placeholder')}
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
                  maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                {t('settings.name.submit')}
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

            queryContext.refetchQueries();
            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success('Organization description updated successfully.');
          }}
        >
          <Card title={t('settings.description.title')} description={t('settings.description.title')}>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Textarea
                name="description"
                placeholder={t('settings.description.placeholder')}
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                {t('settings.description.submit')}
              </Button>
            </div>
          </Card>
        </Form>
        <Form
          onSubmit={async ({ email }) => null}
          onSubmitSuccess={() => {
            toast.success('Ownership of this Organization transferred successfully.');
          }}
        >
          <Card title={t('settings.transfer.title')} description={t('settings.transfer.description')} danger>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input name="email" placeholder={t('settings.transfer.placeholder')} />
              <Button variant="danger" submit>
                {t('settings.transfer.submit')}
              </Button>
            </div>
          </Card>
        </Form>
        <Card title={t('settings.delete.title')} description={t('settings.delete.description')} danger>
          <div>
            <Dialog
              title={t('settings.delete.modal.title')}
              description={t('settings.delete.modal.description', {
                organizationName: session?.organization.name as string,
              })}
              disclosure={
                <Button variant="danger" disabled={deleteOrganization.isLoading}>
                  {t('settings.delete.modal.submit')}
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
                  toast.success('Organization deleted successfully.');

                  queryContext.refetchQueries();
                  reloadSession();
                  router.push('/');
                }}
              >
                {({ handleSubmit }) => (
                  <>
                    <Input
                      name="confirm"
                      placeholder={session?.organization.name}
                      validator={value =>
                        value !== session?.organization.name ? t('settings.delete.modal.error') : undefined
                      }
                    />
                    <Dialog.Buttons>
                      <Dialog.Cancel disabled={deleteOrganization.isLoading} />
                      <Dialog.Action variant="danger" onClick={handleSubmit} disabled={deleteOrganization.isLoading}>
                        {t('settings.delete.modal.submit')}
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

export default Settings;
