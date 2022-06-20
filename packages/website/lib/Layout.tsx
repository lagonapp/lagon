import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ComponentProps, ReactElement, ReactNode, useMemo } from 'react';
import Button from 'lib/components/Button';
import { ChevronDownIcon, CogIcon, LogoutIcon, PlusIcon } from '@heroicons/react/outline';
import Menu from 'lib/components/Menu';
import Divider from 'lib/components/Divider';
import Text from 'lib/components/Text';
import Head from 'next/head';
import Dot from 'lib/components/Dot';
import useSystemTheme from 'react-use-system-theme';

type HeaderLinkProps = {
  href: string;
  selected: boolean;
  children: string;
};

const HeaderLink = ({ href, selected, children }: HeaderLinkProps) => {
  const styles = useMemo(() => (selected ? 'text-gray-800' : 'text-gray-500'), [selected]);

  return (
    <Link href={href}>
      <a className={`${styles} text-md hover:text-gray-800`}>{children}</a>
    </Link>
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
      <div className="py-4 h-16 w-full border-b border-b-gray-200">
        <div className="flex justify-between mx-auto px-4 md:max-w-4xl">
          <div className="flex gap-4 items-center">
            <HeaderLink href="/" selected={asPath === '/' || asPath.startsWith('/functions')}>
              Functions
            </HeaderLink>
            <HeaderLink href="/settings" selected={asPath.startsWith('/settings')}>
              Settings
            </HeaderLink>
          </div>
          <Menu>
            <Menu.Button>
              <Button rightIcon={<ChevronDownIcon className="w-4 h-4" />}>{session.organization.name}</Button>
            </Menu.Button>
            <Menu.Items>
              <Menu.Item icon={<PlusIcon className="w-4 h-4" />}>New organization</Menu.Item>
              <Menu.Item icon={<CogIcon className="w-4 h-4" />} href="/settings">
                Settings
              </Menu.Item>
              <Divider />
              <Menu.Item icon={<LogoutIcon className="w-4 h-4" />} onClick={() => signOut()}>
                Sign out
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      <div className="mb-32">
        {headerOnly ? (
          children
        ) : (
          <div className="mx-auto px-4 md:max-w-4xl">
            <div className="flex justify-between items-center mt-10 mb-4">
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
  );
};

export default Layout;
