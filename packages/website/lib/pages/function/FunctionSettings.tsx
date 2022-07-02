import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import Text from 'lib/components/Text';
import { getCurrentDomain } from 'lib/utils';
import TagsInput from 'lib/components/TagsInput';
import {
  composeValidators,
  cronValidator,
  domainNameValidator,
  functionNameValidator,
  maxLengthValidator,
  minLengthValidator,
  requiredValidator,
} from 'lib/form/validators';
import Dialog from 'lib/components/Dialog';
import { FUNCTION_NAME_MAX_LENGTH, FUNCTION_NAME_MIN_LENGTH } from 'lib/constants';
import { trpc } from 'lib/trpc';
import useFunction from 'lib/hooks/useFunction';
import { QueryObserverBaseResult } from 'react-query';

type FunctionSettingsProps = {
  func: NonNullable<ReturnType<typeof useFunction>['data']>;
  refetch: QueryObserverBaseResult['refetch'];
};

const FunctionSettings = ({ func, refetch }: FunctionSettingsProps) => {
  const router = useRouter();
  const updateFunction = trpc.useMutation(['functions.update']);
  const deleteFunction = trpc.useMutation(['functions.delete']);

  return (
    <div className="flex flex-col gap-8">
      <Form
        initialValues={{
          name: func.name,
        }}
        onSubmit={async ({ name }) => {
          await updateFunction.mutateAsync({
            functionId: func.id,
            ...func,
            name,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function name updated successfully.');
        }}
      >
        <Card
          title="Name"
          description="Change the name of this Function. Note that changing the name also changes the default domain."
        >
          <div className="flex gap-2 items-center">
            <Input
              name="name"
              placeholder="Function name"
              disabled={updateFunction.isLoading}
              validator={composeValidators(
                requiredValidator,
                minLengthValidator(FUNCTION_NAME_MIN_LENGTH),
                maxLengthValidator(FUNCTION_NAME_MAX_LENGTH),
                functionNameValidator,
              )}
            />
            <Button variant="primary" disabled={updateFunction.isLoading} submit>
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
          await updateFunction.mutateAsync({
            functionId: func.id,
            ...func,
            domains,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function domains updated successfully.');
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
            <div className="flex flex-1 flex-col items-start gap-4">
              <div className="flex flex-col gap-1">
                <Text size="lg">Custom domains</Text>
                <div className="flex gap-2 items-center">
                  <TagsInput
                    name="domains"
                    placeholder="mydomain.com"
                    disabled={updateFunction.isLoading}
                    validator={domainNameValidator}
                  />
                </div>
              </div>
              <Button variant="primary" disabled={updateFunction.isLoading} submit>
                Update
              </Button>
            </div>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          cron: func.cron,
        }}
        onSubmit={async ({ cron }) => {
          await updateFunction.mutateAsync({
            functionId: func.id,
            ...func,
            cron: cron || null,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function Cron updated successfully.');
        }}
      >
        <Card title="Cron" description="Run this Function automatically at a scheduled rate using a Cron expression.">
          <div className="flex gap-2 items-center">
            <Input name="cron" placeholder="Cron" disabled={updateFunction.isLoading} validator={cronValidator} />
            <Button variant="primary" disabled={updateFunction.isLoading} submit>
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
          await updateFunction.mutateAsync({
            functionId: func.id,
            ...func,
            env,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function environment variables updated successfully.');
        }}
      >
        {({ values, form }) => (
          <Card
            title="Environment variables"
            description="Environment variables are injected into your Function at runtime."
          >
            <div className="flex flex-col gap-4 items-start">
              <div className="flex gap-2 items-center">
                <Input name="envKey" placeholder="Key" disabled={updateFunction.isLoading} />
                <Input name="envValue" placeholder="Value" type="password" disabled={updateFunction.isLoading} />
                <Button
                  disabled={updateFunction.isLoading}
                  onClick={() => {
                    const { envKey, envValue } = values;

                    if (envKey && envValue) {
                      form.change('env', [...values.env, `${envKey}=${envValue}`]);
                      form.change(`${envKey}-key`, envKey);
                      form.change(`${envKey}-value`, envValue);

                      form.change('envKey', '');
                      form.change('envValue', '');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {values.env.map((env: string) => {
                const [key] = env.split('=');

                return (
                  <div key={env} className="flex gap-2 items-center">
                    <Input name={`${key}-key`} placeholder={key} disabled />
                    <Input name={`${key}-value`} placeholder="*******" disabled />
                    <Button
                      disabled={updateFunction.isLoading}
                      onClick={() => {
                        form.change(
                          'env',
                          values.env.filter((currentEnv: string) => env !== currentEnv),
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
              <Button variant="primary" disabled={updateFunction.isLoading} submit>
                Update
              </Button>
            </div>
          </Card>
        )}
      </Form>
      <Card
        title="Delete"
        description="Delete completely this Function, it's Deployments and Logs. This action is irreversible."
        danger
      >
        <div>
          <Dialog
            title="Delete Function"
            description={`Write this Function's name to confirm deletion: ${func.name}`}
            disclosure={
              <Button variant="danger" disabled={deleteFunction.isLoading}>
                Delete
              </Button>
            }
          >
            <Form
              onSubmit={async () => {
                await deleteFunction.mutateAsync({
                  functionId: func.id,
                });
              }}
              onSubmitSuccess={() => {
                toast.success('Organization deleted successfully.');

                router.push('/');
              }}
            >
              {({ handleSubmit }) => (
                <>
                  <Input
                    name="confirm"
                    placeholder={func.name}
                    validator={value => (value !== func.name ? 'Confirm with the name of this Funtion' : undefined)}
                  />
                  <Dialog.Buttons>
                    <Dialog.Cancel disabled={deleteFunction.isLoading} />
                    <Dialog.Action variant="danger" onClick={handleSubmit} disabled={deleteFunction.isLoading}>
                      Delete Function
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

export default FunctionSettings;
