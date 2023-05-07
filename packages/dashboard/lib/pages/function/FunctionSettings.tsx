import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Button, Card, Form, Input, Text, TagsInput, Dialog, Menu, Divider } from '@lagon/ui';
import { getCurrentDomain } from 'lib/utils';
import {
  composeValidators,
  cronValidator,
  domainNameValidator,
  functionNameValidator,
  maxLengthValidator,
  minLengthValidator,
  requiredValidator,
} from 'lib/form/validators';
import { FUNCTION_NAME_MAX_LENGTH, FUNCTION_NAME_MIN_LENGTH, Regions, REGIONS } from 'lib/constants';
import { trpc } from 'lib/trpc';
import useFunction from 'lib/hooks/useFunction';
import { QueryObserverBaseResult } from '@tanstack/react-query';
import { useScopedI18n } from 'locales';

type FunctionSettingsProps = {
  func: ReturnType<typeof useFunction>['data'];
  refetch: QueryObserverBaseResult['refetch'];
};

const FunctionSettings = ({ func, refetch }: FunctionSettingsProps) => {
  const router = useRouter();
  const t = useScopedI18n('functions.settings');
  const updateFunction = trpc.functionUpdate.useMutation();
  const deleteFunction = trpc.functionDelete.useMutation();

  return (
    <div className="flex flex-col gap-8">
      <Form
        initialValues={{
          name: func?.name,
        }}
        onSubmit={async ({ name }) => {
          if (!func) {
            return;
          }

          await updateFunction.mutateAsync({
            functionId: func.id,
            name,
          });

          await refetch();
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
              disabled={updateFunction.isLoading}
              validator={composeValidators(
                requiredValidator,
                minLengthValidator(FUNCTION_NAME_MIN_LENGTH),
                maxLengthValidator(FUNCTION_NAME_MAX_LENGTH),
                functionNameValidator,
              )}
            />
            <Button variant="primary" disabled={updateFunction.isLoading} submit>
              {t('name.submit')}
            </Button>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          domains: func?.domains,
        }}
        onSubmit={async ({ domains }) => {
          if (!func) {
            return;
          }

          await updateFunction.mutateAsync({
            functionId: func.id,
            domains,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success(t('domains.success'));
        }}
      >
        <Card title={t('domains.title')} description={t('domains.description')}>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:gap-0">
            <div className="flex flex-1 flex-col gap-1">
              <Text size="lg">{t('domains.default')}</Text>
              {func ? <Text>{getCurrentDomain(func)}</Text> : null}
            </div>
            <div className="flex flex-1 flex-col items-start gap-4">
              <div className="flex flex-col gap-1">
                <Text size="lg">{t('domains.custom')}</Text>
                <div className="flex items-center gap-2">
                  <TagsInput
                    name="domains"
                    placeholder={t('domains.custom.placeholder')}
                    disabled={updateFunction.isLoading}
                    validator={domainNameValidator}
                  />
                </div>
              </div>
              <Button variant="primary" disabled={updateFunction.isLoading} submit>
                {t('domains.update')}
              </Button>
            </div>
          </div>
        </Card>
      </Form>
      <Form
        initialValues={{
          cron: func?.cron,
          cronRegion: func?.cronRegion,
        }}
        onSubmit={async ({ cron, cronRegion }) => {
          if (!func) {
            return;
          }

          await updateFunction.mutateAsync({
            functionId: func.id,
            cron: cron || null,
            cronRegion: cronRegion,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success(t('cron.success'));
        }}
      >
        {({ values, form }) => (
          <Card title={t('cron.title')} description={t('cron.description')}>
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:gap-0">
              <div className="flex flex-1 flex-col items-start gap-1">
                <Text size="lg">{t('cron.expression')}</Text>
                <Input
                  name="cron"
                  placeholder={t('cron.expression.placeholder')}
                  disabled={updateFunction.isLoading}
                  validator={cronValidator}
                />
              </div>
              <div className="flex flex-1 flex-col items-start gap-1">
                <Text size="lg">{t('cron.region')}</Text>
                <Menu>
                  <Menu.Button>
                    <Button>{REGIONS[values.cronRegion as Regions] || REGIONS['paris-eu-west']}</Button>
                  </Menu.Button>
                  <Menu.Items>
                    {Object.entries(REGIONS).map(([key, value]) => (
                      <Menu.Item key={key} onClick={() => form.change('cronRegion', key)}>
                        {value}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Menu>
              </div>
            </div>
            <div>
              <Button variant="primary" disabled={updateFunction.isLoading} submit>
                {t('cron.submit')}
              </Button>
            </div>
          </Card>
        )}
      </Form>
      <Form
        initialValues={{
          env: func?.env || {},
        }}
        onSubmit={async ({ env }) => {
          if (!func) {
            return;
          }

          await updateFunction.mutateAsync({
            functionId: func.id,
            env: Object.entries<string>(env).reduce(
              (acc, [key, value]) => [...acc, { key, value }],
              [] as { key: string; value: string }[],
            ),
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function environment variables updated successfully.');
        }}
      >
        {({ values, form }) => (
          <Card title={t('env.title')} description={t('env.description')}>
            <div className="flex flex-col items-start gap-4">
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                <Input
                  name="envKey"
                  placeholder={t('env.placeholder.key')}
                  disabled={updateFunction.isLoading}
                  onPaste={event => {
                    const text = event.clipboardData.getData('text');

                    if (text.includes('\n')) {
                      const entries = text.split('\n');
                      const pastedEnv: Record<string, string> = {};

                      for (const entry of entries) {
                        const [key, value] = entry.split(/=(.*)/s);

                        if (key && value && !key.trimStart().startsWith('#')) {
                          pastedEnv[key] = value;
                        }
                      }

                      form.change('env', { ...values.env, ...pastedEnv });
                      event.preventDefault();
                    }
                  }}
                />
                <Input
                  name="envValue"
                  placeholder={t('env.placeholder.value')}
                  type="password"
                  disabled={updateFunction.isLoading}
                />
                <Button
                  disabled={updateFunction.isLoading}
                  onClick={() => {
                    const { envKey, envValue } = values;

                    if (envKey && envValue) {
                      form.change('env', { ...values.env, [envKey]: envValue });

                      form.change('envKey', '');
                      form.change('envValue', '');
                    }
                  }}
                >
                  {t('env.add')}
                </Button>
              </div>
              {Object.entries<string>(values.env).map(([key, value], index) => {
                return (
                  <div
                    key={`${key}-${value}-${index}`}
                    className="flex flex-col items-start gap-2 md:flex-row md:items-center"
                  >
                    <Input name={`${key}-key`} placeholder={key} disabled />
                    <Input name={`${key}-value`} placeholder={new Array(value.length).fill('*').join('')} disabled />
                    <Button
                      disabled={updateFunction.isLoading}
                      variant="danger"
                      onClick={() => {
                        const newEnv = { ...values.env };
                        delete newEnv[key];

                        form.change('env', newEnv);
                      }}
                    >
                      {t('env.remove')}
                    </Button>
                  </div>
                );
              })}
              <Button variant="primary" disabled={updateFunction.isLoading} submit>
                {t('env.submit')}
              </Button>
            </div>
          </Card>
        )}
      </Form>
      <Card title={t('delete.title')} description={t('delete.description')} danger>
        <div>
          <Dialog
            title={t('delete.modal.title')}
            description={t('delete.modal.description', {
              functionName: func?.name || ('' as string),
            })}
            disclosure={
              <Button variant="danger" disabled={deleteFunction.isLoading}>
                {t('delete.submit')}
              </Button>
            }
          >
            <Form
              onSubmit={async () => {
                if (!func) {
                  return;
                }

                await deleteFunction.mutateAsync({
                  functionId: func.id,
                });
              }}
              onSubmitSuccess={() => {
                toast.success(t('delete.success'));

                router.push('/');
              }}
            >
              {({ handleSubmit }) => (
                <>
                  <Input
                    name="confirm"
                    placeholder={func?.name}
                    validator={value => (value !== func?.name ? t('delete.modal.confirm') : undefined)}
                  />
                  <Dialog.Buttons>
                    <Dialog.Cancel disabled={deleteFunction.isLoading} />
                    <Dialog.Action variant="danger" onClick={handleSubmit} disabled={deleteFunction.isLoading}>
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

export default FunctionSettings;
