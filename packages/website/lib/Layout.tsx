import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ComponentProps, ReactElement, ReactNode, Suspense, useCallback, useMemo } from 'react';
import Button from 'lib/components/Button';
import { ChevronDownIcon, CogIcon, LogoutIcon, PlusIcon } from '@heroicons/react/outline';
import Menu from 'lib/components/Menu';
import Divider from 'lib/components/Divider';
import Text from 'lib/components/Text';
import Head from 'next/head';
import Dot from 'lib/components/Dot';
import useSystemTheme from 'react-use-system-theme';
import useOrganizations from './hooks/useOrganizations';
import EmptyState from './components/EmptyState';
import { trpc } from './trpc';

type HeaderLinkProps = {
  href: string;
  selected: boolean;
  children: string;
};

const HeaderLink = ({ href, selected, children }: HeaderLinkProps) => {
  const styles = useMemo(() => (selected ? 'text-stone-800' : 'text-stone-500'), [selected]);

  return (
    <Link href={href}>
      <a className={`${styles} select-none transition text-md hover:text-stone-800`}>{children}</a>
    </Link>
  );
};

const OrganizationsList = () => {
  const { data: organizations } = useOrganizations();
  const router = useRouter();
  const currentOrganization = trpc.useMutation(['organizations.current']);
  const queryContext = trpc.useContext();

  const switchOrganization = useCallback(
    async (organization: typeof organizations[number]) => {
      await currentOrganization.mutateAsync({
        organizationId: organization.id,
      });

      queryContext.refetchQueries();
      router.push('/');
    },
    [router, currentOrganization, queryContext],
  );

  return (
    <>
      {organizations?.map(organization => (
        <Menu.Item key={organization.id} onClick={() => switchOrganization(organization)}>
          {organization.name}
        </Menu.Item>
      ))}
    </>
  );
};

type LayoutProps = {
  title: string;
  titleStatus?: ComponentProps<typeof Dot>['status'];
  rightItem?: ReactElement;
  headerOnly?: boolean;
  children: ReactNode;
};

const Layout = ({ title, titleStatus, rightItem, headerOnly, children }: LayoutProps) => {
  const { data: session } = useSession();
  const { asPath } = useRouter();
  const theme = useSystemTheme();

  return (
    <>
      <Head>
        <title>{title} - Lagon</title>
        {theme === 'dark' ? (
          <link rel="icon" href="/favicon-white.ico" />
        ) : (
          <link rel="icon" href="/favicon-black.ico" />
        )}
      </Head>
      {session?.organization || asPath === '/new' ? (
        <>
          <div className="py-4 h-16 w-full border-b border-b-stone-200">
            <div className="flex justify-between mx-auto px-4 md:max-w-4xl">
              <div className="flex gap-6 items-center">
                <Link href="/">
                  <a>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon-black.png" alt="Lagon logo" className="h-6 w-6" />
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
                    <Divider />
                    <Menu.Item icon={<PlusIcon className="w-4 h-4" />} href="/new">
                      New organization
                    </Menu.Item>
                    <Menu.Item icon={<CogIcon className="w-4 h-4" />} href="/settings">
                      Settings
                    </Menu.Item>
                    <Divider />
                    <Menu.Item icon={<LogoutIcon className="w-4 h-4" />} onClick={() => signOut()}>
                      Sign out
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              ) : null}
            </div>
          </div>
          <div className="bg-stone-50 min-h-screen">
            {headerOnly ? (
              children
            ) : (
              <div className="mx-auto px-4 md:max-w-4xl">
                <div className="flex justify-between items-center pt-10 mb-4">
                  <Text size="2xl">
                    {titleStatus ? <Dot status={titleStatus} /> : null}
                    {title}
                  </Text>
                  {rightItem}
                </div>
                {children}
              </div>
            )}
          </div>
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
