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
import { FUNCTION_NAME_MAX_LENGTH, FUNCTION_NAME_MIN_LENGTH, Regions, REGIONS } from 'lib/constants';
import { trpc } from 'lib/trpc';
import useFunction from 'lib/hooks/useFunction';
import { QueryObserverBaseResult } from '@tanstack/react-query';
import { useI18n } from 'locales';
import Menu from 'lib/components/Menu';

type FunctionSettingsProps = {
  func: ReturnType<typeof useFunction>['data'];
  refetch: QueryObserverBaseResult['refetch'];
};

const FunctionSettings = ({ func, refetch }: FunctionSettingsProps) => {
  const router = useRouter();
  const { scopedT } = useI18n();
  const t = scopedT('functions.settings');
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
            ...func,
            name,
          });

          await refetch();
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
            ...func,
            domains,
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success(t('domains.success'));
        }}
      >
        <Card title={t('domains.title')} description={t('domains.description')}>
          <div className="flex flex-col md:flex-row gap-6 md:gap-0 justify-between items-start">
            <div className="flex flex-1 flex-col gap-1">
              <Text size="lg">{t('domains.default')}</Text>
              {func ? <Text>{getCurrentDomain(func)}</Text> : null}
            </div>
            <div className="flex flex-1 flex-col items-start gap-4">
              <div className="flex flex-col gap-1">
                <Text size="lg">{t('domains.custom')}</Text>
                <div className="flex gap-2 items-center">
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
            ...func,
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
            <div className="flex flex-col md:flex-row gap-6 md:gap-0 justify-between items-start">
              <div className="flex flex-1 flex-col gap-1 items-start">
                <Text size="lg">{t('cron.expression')}</Text>
                <Input
                  name="cron"
                  placeholder={t('cron.expression.placeholder')}
                  disabled={updateFunction.isLoading}
                  validator={cronValidator}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 items-start">
                <Text size="lg">{t('cron.region')}</Text>
                <Menu>
                  <Menu.Button>
                    <Button>{REGIONS[values.cronRegion as Regions] || REGIONS['EU-WEST-3']}</Button>
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
          env: func?.env || [],
        }}
        onSubmit={async ({ env }) => {
          if (!func) {
            return;
          }

          await updateFunction.mutateAsync({
            functionId: func.id,
            ...func,
            env: (env as string[]).map(currentEnv => {
              const [key, value] = currentEnv.split('=');

              return {
                key,
                value,
              };
            }),
          });

          await refetch();
        }}
        onSubmitSuccess={() => {
          toast.success('Function environment variables updated successfully.');
        }}
      >
        {({ values, form }) => (
          <Card title={t('env.title')} description={t('env.description')}>
            <div className="flex flex-col gap-4 items-start">
              <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                <Input name="envKey" placeholder={t('env.placeholder.key')} disabled={updateFunction.isLoading} />
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
                      form.change('env', [...values.env, `${envKey}=${envValue}`]);
                      form.change(`${envKey}-key`, envKey);
                      form.change(`${envKey}-value`, envValue);

                      form.change('envKey', '');
                      form.change('envValue', '');
                    }
                  }}
                >
                  {t('env.add')}
                </Button>
              </div>
              {values.env.map(({ key }: { key: string }) => {
                return (
                  <div key={key} className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    <Input name={`${key}-key`} placeholder={key} disabled />
                    <Input name={`${key}-value`} placeholder="*******" disabled />
                    <Button
                      disabled={updateFunction.isLoading}
                      onClick={() => {
                        form.change(
                          'env',
                          values.env.filter(({ key: currentKey }: { key: string }) => key !== currentKey),
                        );
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
