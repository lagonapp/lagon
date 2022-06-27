import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import Layout from 'lib/Layout';
import { composeValidators, maxLengthValidator, minLengthValidator, requiredValidator } from 'lib/form/validators';
import Dialog from 'lib/components/Dialog';
import { useRouter } from 'next/router';
import { reloadSession } from 'lib/utils';
import Textarea from 'lib/components/Textarea';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { trpc } from 'lib/trpc';

const Settings = () => {
  const { data: session } = useSession();
  const updateOrganization = trpc.useMutation(['organizations.update']);
  const deleteOrganization = trpc.useMutation(['organizations.delete']);
  const router = useRouter();

  return (
    <Layout title="Settings">
      <div className="flex flex-col gap-8">
        <Form
          initialValues={{
            name: session.organization?.name,
          }}
          onSubmit={async ({ name }) => {
            await updateOrganization.mutateAsync({
              organizationId: session.organization.id,
              ...session.organization,
              name,
            });

            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success('Organization name updated successfully.');
          }}
        >
          <Card title="Name" description="Change the name of this Organization.">
            <div className="flex gap-2 items-center">
              <Input
                name="name"
                placeholder="Organization name"
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
                  maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                Update
              </Button>
            </div>
          </Card>
        </Form>
        <Form
          initialValues={{
            description: session.organization?.description,
          }}
          onSubmit={async ({ description }) => {
            await updateOrganization.mutateAsync({
              organizationId: session.organization.id,
              ...session.organization,
              description,
            });

            reloadSession();
          }}
          onSubmitSuccess={() => {
            toast.success('Organization description updated successfully.');
          }}
        >
          <Card title="Description" description="Change the description of this Organization.">
            <div className="flex gap-2 items-center">
              <Textarea
                name="description"
                placeholder="Organization description"
                disabled={updateOrganization.isLoading}
                validator={composeValidators(
                  requiredValidator,
                  maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH),
                )}
              />
              <Button variant="primary" disabled={updateOrganization.isLoading} submit>
                Update
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
          <Card title="Tranfer" description="Transfer the ownership of this Organization to another user?" danger>
            <div className="flex gap-2 items-center">
              <Input name="email" placeholder="New Owner email" />
              <Button variant="danger" submit>
                Transfer ownership
              </Button>
            </div>
          </Card>
        </Form>
        <Card
          title="Delete"
          description="Delete completely this Organization, it's Functions, Deployments and Logs. This action is irreversible."
          danger
        >
          <Dialog
            title="Delete Organization"
            description={`Write this Organization's name to confirm deletion: ${session.organization.name}`}
            disclosure={
              <Button variant="danger" disabled={deleteOrganization.isLoading}>
                Delete
              </Button>
            }
          >
            <Form
              onSubmit={() => deleteOrganization.mutateAsync()}
              onSubmitSuccess={() => {
                toast.success('Organization deleted successfully.');

                reloadSession();
                router.push('/');
              }}
            >
              {handleSubmit => (
                <>
                  <Input
                    name="confirm"
                    placeholder={session.organization.name}
                    validator={value =>
                      value !== session.organization.name ? 'Confirm with the name of this Funtion' : undefined
                    }
                  />
                  <Dialog.Buttons>
                    <Dialog.Cancel disabled={deleteOrganization.isLoading} />
                    <Dialog.Action variant="danger" onClick={handleSubmit} disabled={deleteOrganization.isLoading}>
                      Delete Organization
                    </Dialog.Action>
                  </Dialog.Buttons>
                </>
              )}
            </Form>
          </Dialog>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
