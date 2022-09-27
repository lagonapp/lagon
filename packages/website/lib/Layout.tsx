import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, Suspense, useCallback, useMemo } from 'react';
import Button from 'lib/components/Button';
import {
  ChevronDownIcon,
  CogIcon,
  DesktopComputerIcon,
  LogoutIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  TranslateIcon,
  UserIcon,
} from '@heroicons/react/outline';
import Menu from 'lib/components/Menu';
import Divider from 'lib/components/Divider';
import Head from 'next/head';
import useOrganizations from './hooks/useOrganizations';
import EmptyState from './components/EmptyState';
import { trpc } from './trpc';
import { reloadSession } from './utils';
import useTheme from './hooks/useTheme';
import { useChangeLocale, useI18n } from 'locales';
import { useQueryClient } from '@tanstack/react-query';

type HeaderLinkProps = {
  href: string;
  selected: boolean;
  children: string;
};

const HeaderLink = ({ href, selected, children }: HeaderLinkProps) => {
  const styles = useMemo(
    () => (selected ? 'text-stone-800 dark:text-stone-200' : 'text-stone-500 dark:text-stone-400'),
    [selected],
  );

  return (
    <Link href={href}>
      <a className={`${styles} select-none transition text-md hover:text-stone-800 dark:hover:text-stone-200`}>
        {children}
      </a>
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
  children: ReactNode;
};

const Layout = ({ title, children }: LayoutProps) => {
  const { data: session } = useSession();
  const { asPath, locale } = useRouter();
  const { theme, savedTheme, updateTheme } = useTheme();
  const changeLocale = useChangeLocale();
  const { scopedT } = useI18n();
  const t = scopedT('layout');

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
      {session?.organization || asPath === '/new' ? (
        <>
          <div className="py-4 h-16 w-full bg-white dark:bg-stone-900 border-b border-b-stone-200 dark:border-b-stone-700">
            <div className="flex justify-between mx-auto px-4 md:max-w-4xl">
              <div className="flex gap-6 items-center">
                <Link href="/">
                  <a>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/icon-${theme === 'Dark' ? 'white' : 'black'}.png`}
                      alt="Lagon logo"
                      className="h-6 w-6"
                    />
                  </a>
                </Link>
                <HeaderLink href="/" selected={asPath === '/' || asPath.startsWith('/functions')}>
                  {t('header.functions')}
                </HeaderLink>
                <HeaderLink href="/settings" selected={asPath.startsWith('/settings')}>
                  {t('header.settings')}
                </HeaderLink>
              </div>
              {session?.organization ? (
                <Menu>
                  <Menu.Button>
                    <Button rightIcon={<ChevronDownIcon className="w-4 h-4" />}>{session.organization.name}</Button>
                  </Menu.Button>
                  <Menu.Items>
                    <Suspense fallback={null}>
                      <OrganizationsList />
                    </Suspense>
                    <Menu.Item icon={<PlusIcon className="w-4 h-4" />} href="/new">
                      {t('header.menu.newOrganization')}
                    </Menu.Item>
                    <Menu.Item icon={<CogIcon className="w-4 h-4" />} href="/settings">
                      {t('header.menu.settings')}
                    </Menu.Item>
                    <Menu>
                      <Menu.Button>
                        <Menu.Item icon={<SunIcon className="w-4 h-4" />}>{t('header.menu.theme')}</Menu.Item>
                      </Menu.Button>
                      <Menu.Items>
                        <Menu.Item
                          icon={<SunIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'Light'}
                          onClick={() => updateTheme('Light')}
                        >
                          {t('header.menu.theme.light')}
                        </Menu.Item>
                        <Menu.Item
                          icon={<MoonIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'Dark'}
                          onClick={() => updateTheme('Dark')}
                        >
                          {t('header.menu.theme.dark')}
                        </Menu.Item>
                        <Menu.Item
                          icon={<DesktopComputerIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'System'}
                          onClick={() => updateTheme('System')}
                        >
                          {t('header.menu.theme.system')}
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                    <Divider />
                    <Menu.Item icon={<UserIcon className="w-4 h-4" />} href="/profile">
                      {t('header.menu.profile')}
                    </Menu.Item>
                    <Menu>
                      <Menu.Button>
                        <Menu.Item icon={<TranslateIcon className="w-4 h-4" />}>
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
                    <Menu.Item icon={<LogoutIcon className="w-4 h-4" />} onClick={() => signOut()}>
                      {t('header.menu.signOut')}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              ) : null}
            </div>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800 min-h-screen">{children}</div>
        </>
      ) : (
        <div className="w-screen h-screen flex justify-center items-center">
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
  );
};

export default Layout;
