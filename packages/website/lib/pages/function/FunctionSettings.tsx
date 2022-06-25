import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSWRConfig } from 'swr';
import { GetFunctionResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import Text from 'lib/components/Text';
import { fetchApi, getCurrentDomain } from 'lib/utils';
import TagsInput from 'lib/components/TagsInput';
import { cronValidator, requiredValidator } from 'lib/form/validators';
import Dialog from 'lib/components/Dialog';

type FunctionSettingsProps = {
  func: GetFunctionResponse;
};

const FunctionSettings = ({ func }: FunctionSettingsProps) => {
  const { data: session } = useSession();
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingDomains, setIsUpdatingDomains] = useState(false);
  const [isUpdatingCron, setIsUpdatingCron] = useState(false);
  const [isUpdatingEnvVariables, setIsUpdatingEnvVariables] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <Form
        initialValues={{
          name: func.name,
        }}
        onSubmit={async ({ name }) => {
          setIsUpdatingName(true);

          await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...func,
              name,
            }),
          });

          await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
        }}
        onSubmitSuccess={() => {
          toast.success('Function name updated successfully.');
          setIsUpdatingName(false);
        }}
        onSubmitError={() => {
          setIsUpdatingName(false);
        }}
      >
        <Card
          title="Name"
          description="Change the name of this Function. Note that changing the name also changes the default domain."
        >
          <div className="flex gap-2 items-center">
            <Input name="name" placeholder="Function name" disabled={isUpdatingName} validator={requiredValidator} />
            <Button variant="primary" disabled={isUpdatingName} submit>
              Update
            </Button>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          domains: func.domains,
        }}
        onSubmit={async ({ domains }) => {
          setIsUpdatingDomains(true);

          await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...func,
              domains,
            }),
          });

          await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
        }}
        onSubmitSuccess={() => {
          toast.success('Function domains updated successfully.');
          setIsUpdatingDomains(false);
        }}
        onSubmitError={() => {
          setIsUpdatingDomains(false);
        }}
      >
        <Card
          title="Domains"
          description="The default domain is based on this Function's name. You can also add custom domains."
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-1 flex-col gap-1">
              <Text size="lg">Default domain</Text>
              <Text>{getCurrentDomain(func)}</Text>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Text size="lg">Custom domains</Text>
              <div className="flex gap-2 items-center">
                <TagsInput name="domains" placeholder="Custom domains" disabled={isUpdatingDomains} />
                <Button variant="primary" disabled={isUpdatingDomains} submit>
                  Update
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          cron: func.cron,
        }}
        onSubmit={async ({ cron }) => {
          setIsUpdatingCron(true);

          await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...func,
              cron,
            }),
          });

          await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
        }}
        onSubmitSuccess={() => {
          toast.success('Function Cron updated successfully.');
          setIsUpdatingCron(false);
        }}
        onSubmitError={() => {
          setIsUpdatingCron(false);
        }}
      >
        <Card title="Cron" description="Run this Function automatically at a scheduled rate using a Cron expression.">
          <div className="flex gap-2 items-center">
            <Input name="cron" placeholder="Cron" disabled={isUpdatingCron} validator={cronValidator} />
            <Button variant="primary" disabled={isUpdatingCron} submit>
              Update
            </Button>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          env: func.env,
        }}
        onSubmit={async ({ env }) => {
          setIsUpdatingEnvVariables(true);

          await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...func,
              env,
            }),
          });

          await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
        }}
        onSubmitSuccess={() => {
          toast.success('Function environment variables updated successfully.');
          setIsUpdatingEnvVariables(false);
        }}
        onSubmitError={() => {
          setIsUpdatingEnvVariables(false);
        }}
      >
        <Card
          title="Environment variables"
          description="Environment variables are injected into your Function at runtime."
        >
          <div className="flex gap-2 items-center">
            <Input name="env" placeholder="Environment variables" disabled={isUpdatingEnvVariables} />
            <Button variant="primary" disabled={isUpdatingEnvVariables} submit>
              Update
            </Button>
          </div>
        </Card>
      </Form>
      <Card
        title="Delete"
        description="Delete completely this Function, it's Deployments and Logs. This action is irreversible."
      >
        <Dialog
          title="Delete Function"
          description={`Write this Function's name to confirm deletion: ${func.name}`}
          disclosure={
            <Button variant="danger" disabled={isDeleting}>
              Delete
            </Button>
          }
        >
          <Form
            onSubmit={async () => {
              setIsDeleting(true);

              await fetchApi(`/api/organizations/${session.organization.id}/functions/${func.id}`, {
                method: 'DELETE',
              });
            }}
            onSubmitSuccess={() => {
              toast.success('Organization deleted successfully.');
              setIsDeleting(false);

              router.push('/');
            }}
            onSubmitError={() => {
              setIsDeleting(false);
            }}
          >
            {handleSubmit => (
              <>
                <Input
                  name="confirm"
                  placeholder={func.name}
                  validator={value => (value !== func.name ? 'Confirm with the name of this Funtion' : undefined)}
                />
                <Dialog.Buttons>
                  <Dialog.Cancel disabled={isDeleting} />
                  <Dialog.Action variant="danger" onClick={handleSubmit} disabled={isDeleting}>
                    Delete Function
                  </Dialog.Action>
                </Dialog.Buttons>
              </>
            )}
          </Form>
        </Dialog>
      </Card>
    </div>
  );
};

export default FunctionSettings;
