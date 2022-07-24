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
import { getLocaleStaticProps, useI18n } from 'locales';
import { GetStaticProps } from 'next';

const Settings = () => {
  const { data: session } = useSession();
  const updateOrganization = trpc.useMutation(['organizations.update']);
  const deleteOrganization = trpc.useMutation(['organizations.delete']);
  const router = useRouter();
  const queryContext = trpc.useContext();
  const { scopedT } = useI18n();
  const t = scopedT('settings');

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

            queryContext.refetchQueries();
            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success('Organization description updated successfully.');
          }}
        >
          <Card title={t('description.title')} description={t('description.title')}>
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
        <Form
          onSubmit={async ({ email }) => null}
          onSubmitSuccess={() => {
            toast.success('Ownership of this Organization transferred successfully.');
          }}
        >
          <Card title={t('transfer.title')} description={t('transfer.description')} danger>
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
              <Input name="email" placeholder={t('transfer.placeholder')} />
              <Button variant="danger" submit>
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
                  {t('delete.modal.submit')}
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

export const getStaticProps: GetStaticProps = getLocaleStaticProps();

export default Settings;
