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
  const currentOrganization = trpc.useMutation(['organizations.current']);
  const queryContext = trpc.useContext();
  const { data: session } = useSession();

  const switchOrganization = useCallback(
    async (organization: NonNullable<typeof organizations>[number]) => {
      await currentOrganization.mutateAsync({
        organizationId: organization.id,
      });

      queryContext.refetchQueries();
      reloadSession();
      router.push('/');
    },
    [router, currentOrganization, queryContext],
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
  const { asPath } = useRouter();
  const { theme, savedTheme, updateTheme } = useTheme();

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
                  Functions
                </HeaderLink>
                <HeaderLink href="/settings" selected={asPath.startsWith('/settings')}>
                  Settings
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
                      New organization
                    </Menu.Item>
                    <Menu.Item icon={<CogIcon className="w-4 h-4" />} href="/settings">
                      Settings
                    </Menu.Item>
                    <Menu>
                      <Menu.Button>
                        <Menu.Item icon={<SunIcon className="w-4 h-4" />}>Theme</Menu.Item>
                      </Menu.Button>
                      <Menu.Items>
                        <Menu.Item
                          icon={<SunIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'Light'}
                          onClick={() => updateTheme('Light')}
                        >
                          Light
                        </Menu.Item>
                        <Menu.Item
                          icon={<MoonIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'Dark'}
                          onClick={() => updateTheme('Dark')}
                        >
                          Dark
                        </Menu.Item>
                        <Menu.Item
                          icon={<DesktopComputerIcon className="w-4 h-4" />}
                          disabled={savedTheme === 'System'}
                          onClick={() => updateTheme('System')}
                        >
                          System
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                    <Divider />
                    <Menu.Item icon={<UserIcon className="w-4 h-4" />} href="/profile">
                      Profile
                    </Menu.Item>
                    <Menu.Item icon={<LogoutIcon className="w-4 h-4" />} onClick={() => signOut()}>
                      Sign out
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
            title="No Organization found"
            description="Please create an Organization to get started."
            action={
              <Button variant="primary" href="/new">
                Create Organization
              </Button>
            }
          />
        </div>
      )}
    </>
  );
};

export default Layout;
