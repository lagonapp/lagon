import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HTMLAttributeAnchorTarget, ReactNode, Suspense, useCallback, useMemo } from 'react';
import { Button, Menu, Divider, EmptyState } from '@lagon/ui';
import {
  ChevronDownIcon,
  CogIcon,
  ComputerDesktopIcon,
  ArrowLeftOnRectangleIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  LanguageIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24//outline';
import Head from 'next/head';
import useOrganizations from '../hooks/useOrganizations';
import { trpc } from '../trpc';
import { reloadSession } from '../utils';
import useTheme from '../hooks/useTheme';
import { useChangeLocale, useScopedI18n } from 'locales';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

type HeaderLinkProps = {
  href: string;
  selected: boolean;
  target?: HTMLAttributeAnchorTarget;
  children: ReactNode;
};

const HeaderLink = ({ href, selected, target, children }: HeaderLinkProps) => {
  const styles = useMemo(
    () => (selected ? 'text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400'),
    [selected],
  );

  return (
    <Link
      href={href}
      target={target}
      className={`${styles} text-md flex select-none items-center gap-1 transition hover:text-stone-800 dark:hover:text-stone-200`}
    >
      {children}
    </Link>
  );
};

const OrganizationsList = () => {
  const { data: organizations } = useOrganizations();
  const router = useRouter();
  const currentOrganization = trpc.organizationSetCurrent.useMutation();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const switchOrganization = useCallback(
    async (organization: NonNullable<typeof organizations>[number]) => {
      await currentOrganization.mutateAsync({
        organizationId: organization.id,
      });

      queryClient.refetchQueries();
      reloadSession();
      router.push('/');
    },
    [router, currentOrganization, queryClient],
  );

  // If we only have one organization, hide completly
  // the list since it will be empty
  if (organizations?.length === 1) {
    return null;
  }

  return (
    <>
      {organizations
        ?.filter(organization => organization.id !== session?.organization.id)
        .map(organization => (
          <Menu.Item key={organization.id} onClick={() => switchOrganization(organization)}>
            {organization.name}
          </Menu.Item>
        ))}
      <Divider />
    </>
  );
};

type LayoutProps = {
  title: string;
  anonymous?: boolean;
  children: ReactNode;
};

const Layout = ({ title, anonymous, children }: LayoutProps) => {
  const { data: session } = useSession();
  const { asPath, locale } = useRouter();
  const { theme, savedTheme, updateTheme } = useTheme();
  const changeLocale = useChangeLocale();
  const t = useScopedI18n('layout');

  return (
    <>
      <Head>
        <title>{title} - Lagon</title>
        {theme === 'Dark' ? (
          <link rel="icon" href="/favicon-white.ico" />
        ) : (
          <link rel="icon" href="/favicon-black.ico" />
        )}
      </Head>
      {anonymous ? (
        children
      ) : (
        <>
          {session?.organization || asPath === '/new' ? (
            <>
              <div className="h-16 w-full border-b border-b-stone-200 bg-white py-4 dark:border-b-stone-700 dark:bg-stone-900">
                <div className="mx-auto flex justify-between px-4 md:max-w-4xl">
                  <div className="flex items-center gap-6">
                    <Link href="/">
                      <Image
                        src={`/icon-${theme === 'Dark' ? 'white' : 'black'}.png`}
                        alt="Lagon logo"
                        width="24"
                        height="24"
                      />
                    </Link>
                    <HeaderLink href="/" selected={asPath === '/' || asPath.startsWith('/functions')}>
                      {t('header.functions')}
                    </HeaderLink>
                    <HeaderLink href="/settings" selected={asPath.startsWith('/settings')}>
                      {t('header.settings')}
                    </HeaderLink>
                    <HeaderLink href="https://docs.lagon.app" target="_blank" selected={false}>
                      {t('header.documentation')}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </HeaderLink>
                  </div>
                  {session?.organization ? (
                    <Menu>
                      <Menu.Button>
                        <Button rightIcon={<ChevronDownIcon className="h-4 w-4" />}>{session.organization.name}</Button>
                      </Menu.Button>
                      <Menu.Items>
                        <Suspense fallback={null}>
                          <OrganizationsList />
                        </Suspense>
                        <Menu.Item icon={<PlusIcon className="h-4 w-4" />} href="/new">
                          {t('header.menu.newOrganization')}
                        </Menu.Item>
                        <Menu.Item icon={<CogIcon className="h-4 w-4" />} href="/settings">
                          {t('header.menu.settings')}
                        </Menu.Item>
                        <Menu>
                          <Menu.Button>
                            <Menu.Item icon={<SunIcon className="h-4 w-4" />}>{t('header.menu.theme')}</Menu.Item>
                          </Menu.Button>
                          <Menu.Items>
                            <Menu.Item
                              icon={<SunIcon className="h-4 w-4" />}
                              disabled={savedTheme === 'Light'}
                              onClick={() => updateTheme('Light')}
                            >
                              {t('header.menu.theme.light')}
                            </Menu.Item>
                            <Menu.Item
                              icon={<MoonIcon className="h-4 w-4" />}
                              disabled={savedTheme === 'Dark'}
                              onClick={() => updateTheme('Dark')}
                            >
                              {t('header.menu.theme.dark')}
                            </Menu.Item>
                            <Menu.Item
                              icon={<ComputerDesktopIcon className="h-4 w-4" />}
                              disabled={savedTheme === 'System'}
                              onClick={() => updateTheme('System')}
                            >
                              {t('header.menu.theme.system')}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                        <Divider />
                        <Menu.Item icon={<UserIcon className="h-4 w-4" />} href="/profile">
                          {t('header.menu.profile')}
                        </Menu.Item>
                        <Menu>
                          <Menu.Button>
                            <Menu.Item icon={<LanguageIcon className="h-4 w-4" />}>
                              {t('header.menu.language', {
                                locale: locale as string,
                              })}
                            </Menu.Item>
                          </Menu.Button>
                          <Menu.Items>
                            <Menu.Item icon={<i>🇺🇸</i>} disabled={locale === 'en'} onClick={() => changeLocale('en')}>
                              {t('header.menu.language.en')}
                            </Menu.Item>
                            <Menu.Item icon={<i>🇫🇷</i>} disabled={locale === 'fr'} onClick={() => changeLocale('fr')}>
                              {t('header.menu.language.fr')}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                        <Menu.Item icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />} onClick={() => signOut()}>
                          {t('header.menu.signOut')}
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                  ) : null}
                </div>
              </div>
              <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-800">{children}</div>
            </>
          ) : (
            <div className="flex h-screen w-screen items-center justify-center">
              <EmptyState
                title={t('empty.title')}
                description={t('empty.description')}
                action={
                  <Button variant="primary" href="/new">
                    {t('empty.action')}
                  </Button>
                }
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Layout;
