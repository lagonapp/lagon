import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Button, Card, Form, Input, Text, Dialog, Menu, Divider, Dot } from '@lagon/ui';
import { getCurrentDomain, getFullDomain } from 'lib/utils';
import {
  alphaNumUnderscoreValidator,
  composeValidators,
  cronValidator,
  domainNameValidator,
  functionNameValidator,
  maxLengthValidator,
  minLengthValidator,
  requiredValidator,
} from 'lib/form/validators';
import {
  ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH,
  ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE,
  FUNCTION_NAME_MAX_LENGTH,
  FUNCTION_NAME_MIN_LENGTH,
  Regions,
  REGIONS,
} from 'lib/constants';
import { trpc } from 'lib/trpc';
import useFunction from 'lib/hooks/useFunction';
import { QueryObserverBaseResult } from '@tanstack/react-query';
import { useScopedI18n } from 'locales';
import { Copiable, Link } from '@lagon/ui';
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import { getHumanFriendlyCron } from 'lib/utils';
import { isInSubnet } from 'is-in-subnet'

// https://www.cloudflare.com/ips-v4
const CLOUDFLARE_SUBNETS = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
]

type FunctionSettingsProps = {
  func: ReturnType<typeof useFunction>['data'];
  refetch: QueryObserverBaseResult['refetch'];
};

type DomainStatus = {
  status: ComponentProps<typeof Dot>['status'];
  help: string | ReactNode;
};

type DomainsStatus = Record<string, DomainStatus>;

const FunctionSettings = ({ func, refetch }: FunctionSettingsProps) => {
  const router = useRouter();
  const t = useScopedI18n('functions.settings');
  const updateFunction = trpc.functionUpdate.useMutation();
  const deleteFunction = trpc.functionDelete.useMutation();
  const [domainsStatus, setDomainsStatus] = useState<DomainsStatus>({});

  const defaultDomain = func ? getCurrentDomain(func) : '';

  const deleteDomain = async (domain: string) => {
    if (!func) {
      return;
    }

    await updateFunction.mutateAsync({
      functionId: func.id,
      domains: func.domains.filter(current => current !== domain),
    });

    await refetch();

    toast.success(t('domains.list.delete.success'));
  };

  useEffect(() => {
    if (func?.domains) {
      setDomainsStatus(
        func.domains.reduce(
          (acc, current) => ({
            ...acc,
            [current]: {
              status: 'info',
              help: '',
            },
          }),
          {},
        ),
      );

      const promises = func.domains.map(async domain => {
        const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}`, {
          headers: {
            accept: 'application/dns-json',
          },
        });
        const result = await response.json();

        return {
          result,
          domain,
        };
      });

      Promise.all(promises).then(results => {
        const newDomainsStatus = results.reduce<DomainsStatus>((acc, current) => {
          const { domain, result } = current;

          const data = result.Answer?.[0]?.data;
          let domainStatus: DomainStatus;

          if (data) {
            try {
              if (isInSubnet(data, CLOUDFLARE_SUBNETS)) {
                domainStatus = {
                  status: 'info',
                  help: t('domains.list.valid.cf'),
                };
              }
            } catch { }
          }

          if (data === `${defaultDomain}.`) {
            // Record pointing to the function's domain
            domainStatus = {
              status: 'success',
              help: t('domains.list.valid'),
            };
          } else if (data && isInSubnet(data, CLOUDFLARE_SUBNETS)) {
            // Proxied behind Cloudflare, can't check if set up properly
            domainStatus = {
              status: 'info',
              help: t('domains.list.valid.cf'),
            };
          } else if (data) {
            // Record set but wrong
            domainStatus = {
              status: 'danger',
              help: t('domains.list.invalid', {
                domain: result.Answer?.[0]?.data ?? '',
                target: (
                  <Copiable value={defaultDomain} className="inline-flex">
                    <Text size="sm" strong>
                      {defaultDomain}
                    </Text>
                  </Copiable>
                ),
              }),
            };
          } else {
            // No record set
            domainStatus = {
              status: 'danger',
              help: t('domains.list.invalid.none', {
                target: (
                  <Copiable value={defaultDomain} className="inline-flex">
                    <Text size="sm" strong>
                      {defaultDomain}
                    </Text>
                  </Copiable>
                ),
              }),
            };
          }

          return {
            ...acc,
            [domain]: domainStatus,
          };
        }, {});

        setDomainsStatus(newDomainsStatus);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [func?.domains, defaultDomain]);

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
        }}
        onSubmitSuccess={async () => {
          toast.success(t('name.success'));
          await refetch();
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
      {func?.cron === null ? (
        <Card
          title={t('domains.title')}
          description={
            <>
              {t('domains.description')}&nbsp;
              <Link inline href="https://docs.lagon.app/cloud/domains" target="_blank">
                {t('domains.doc')}
              </Link>
            </>
          }
          rightItem={
            <Dialog
              title={t('domains.add.modal.title')}
              description={t('domains.add.modal.description')}
              disclosure={
                <Button variant="primary" disabled={updateFunction.isLoading}>
                  {t('domains.add')}
                </Button>
              }
              onSubmit={async ({ domain }) => {
                if (!func) {
                  return;
                }

                await updateFunction.mutateAsync({
                  functionId: func.id,
                  domains: [...(func.domains ?? []), domain],
                });
              }}
              onSubmitSuccess={async () => {
                toast.success(t('domains.add.success'));
                await refetch();
              }}
            >
              <div className="flex flex-col gap-6">
                <Text>
                  {t('domains.add.modal.cname', {
                    domain: (
                      <Copiable value={defaultDomain} className="inline-flex">
                        <Text strong>{defaultDomain}</Text>
                      </Copiable>
                    ),
                  })}
                  &nbsp;
                  <Link href="https://docs.lagon.app/cloud/domains#pointing-your-domain-to-lagon" target="_blank">
                    {t('domains.add.modal.doc')}
                  </Link>
                </Text>
                <Input
                  name="domain"
                  placeholder="www.example.com"
                  validator={composeValidators(domainNameValidator, requiredValidator)}
                />
              </div>
              <Dialog.Buttons>
                <Dialog.Cancel disabled={updateFunction.isLoading} />
                <Dialog.Action variant="primary" disabled={updateFunction.isLoading}>
                  {t('domains.add.modal.submit')}
                </Dialog.Action>
              </Dialog.Buttons>
            </Dialog>
          }
        >
          <div>
            <Divider />
            <div className="flex items-center justify-between gap-4 px-4">
              <div className="flex items-center">
                <Dot status="success" />
                <Link href={getFullDomain(defaultDomain)} target="_blank">
                  {defaultDomain}
                </Link>
              </div>
              <Text size="sm">{t('domains.list.default')}</Text>
              <Button variant="danger" disabled>
                {t('domains.list.delete')}
              </Button>
            </div>
            {func?.domains?.map(domain => (
              <>
                <Divider />
                <div className="flex items-center justify-between gap-4 px-4" key={domain}>
                  <div className="flex items-center">
                    <Dot status={domainsStatus[domain]?.status ?? 'info'} />
                    <Link href={getFullDomain(domain)} target="_blank">
                      {domain}
                    </Link>
                  </div>
                  <Text size="sm">{domainsStatus[domain]?.help}</Text>
                  <Button variant="danger" disabled={updateFunction.isLoading} onClick={() => deleteDomain(domain)}>
                    {t('domains.list.delete')}
                  </Button>
                </div>
              </>
            ))}
          </div>
        </Card>
      ) : null}
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
        }}
        onSubmitSuccess={async () => {
          toast.success(t('cron.success'));
          await refetch();
        }}
      >
        {({ values, form }) => (
          <Card
            title={t('cron.title')}
            description={
              <>
                {t('cron.description')}&nbsp;
                <Link inline href="https://docs.lagon.app/cloud/cron" target="_blank">
                  {t('cron.doc')}
                </Link>
              </>
            }
          >
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:gap-0">
              <div className="flex flex-1 flex-col items-start gap-1">
                <Text size="lg">{t('cron.expression')}</Text>
                <Input
                  name="cron"
                  placeholder={t('cron.expression.placeholder')}
                  disabled={updateFunction.isLoading}
                  validator={cronValidator}
                />
                {getHumanFriendlyCron(values.cron) === values.cron ? null : (
                  <Text size="sm">{getHumanFriendlyCron(values.cron)}</Text>
                )}
              </div>
              <div className="flex flex-1 flex-col items-start gap-1">
                <Text size="lg">{t('cron.region')}</Text>
                <Menu>
                  <Menu.Button>
                    <Button>{REGIONS[values.cronRegion as Regions] || values.cronRegion}</Button>
                  </Menu.Button>
                  <Menu.Items>
                    {Object.entries(REGIONS).map(([key, value]) => (
                      <Menu.Item key={key} onClick={() => form.change('cronRegion', key)}>
                        {value}
                      </Menu.Item>
                    ))}
                    {process.env.NODE_ENV === 'development' ? (
                      <Menu.Item onClick={() => form.change('cronRegion', 'local')}>Local</Menu.Item>
                    ) : null}
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
        }}
        onSubmitSuccess={async () => {
          toast.success('Function environment variables updated successfully.');
          await refetch();
        }}
      >
        {({ values, form }) => (
          <Card
            title={t('env.title')}
            description={
              <>
                {t('env.description')}&nbsp;
                <Link inline href="https://docs.lagon.app/cloud/environment-variables" target="_blank">
                  {t('env.doc')}
                </Link>
              </>
            }
          >
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
                  validator={composeValidators(
                    maxLengthValidator(ENVIRONMENT_VARIABLE_KEY_MAX_LENGTH),
                    alphaNumUnderscoreValidator,
                  )}
                />
                <Input
                  name="envValue"
                  placeholder={t('env.placeholder.value')}
                  type="password"
                  disabled={updateFunction.isLoading}
                  validator={maxLengthValidator(ENVIRONMENT_VARIABLE_VALUE_MAX_SIZE)}
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
            <Input
              name="confirm"
              placeholder={func?.name}
              validator={value => (value !== func?.name ? t('delete.modal.confirm') : undefined)}
            />
            <Dialog.Buttons>
              <Dialog.Cancel disabled={deleteFunction.isLoading} />
              <Dialog.Action variant="danger" disabled={deleteFunction.isLoading}>
                {t('delete.modal.submit')}
              </Dialog.Action>
            </Dialog.Buttons>
          </Dialog>
        </div>
      </Card>
    </div>
  );
};

export default FunctionSettings;
