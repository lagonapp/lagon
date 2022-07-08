import { ComponentProps, ReactElement, ReactNode, useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/router';

type NavListProps = {
  rightItem?: ReactElement;
  children: ReactNode;
};

const NavList = ({ rightItem, children }: NavListProps) => {
  return (
    <Tabs.List className="flex items-center justify-between border-b border-b-stone-200 dark:border-b-stone-700 mb-8">
      <div className="flex -mb-[2px] gap-2 overflow-x-scroll md:overflow-x-auto overflow-y-hidden">{children}</div>
      {rightItem}
    </Tabs.List>
  );
};

type NavLinkProps = {
  value: string;
  children: ReactNode;
};

const NavLink = ({ value, children }: NavLinkProps) => {
  return (
    <Tabs.Trigger
      value={value}
      className="select-none px-4 py-2 text-base transition text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
    >
      {children}
    </Tabs.Trigger>
  );
};

type NavContentProps = {
  value: string;
  children: ReactNode;
};

const NavContent = ({ value, children }: NavContentProps) => {
  return <Tabs.Content value={value}>{children}</Tabs.Content>;
};

type NavProps = {
  defaultValue: string;
  orientation?: ComponentProps<typeof Tabs.Root>['orientation'];
  children: ReactNode;
};

const Nav = ({ defaultValue, orientation = 'horizontal', children }: NavProps) => {
  const router = useRouter();
  const [tab, setTab] = useState((router.query.tab as string) || defaultValue);

  useEffect(() => {
    // Set a timeout of 100ms to allow the tab to render before updating the query
    const timeout = setTimeout(() => {
      router.replace({
        query: {
          ...router.query,
          tab,
        },
      });
    }, 100);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <Tabs.Root value={tab} orientation={orientation} onValueChange={tab => setTab(tab)}>
      {children}
    </Tabs.Root>
  );
};

Nav.List = NavList;
Nav.Link = NavLink;
Nav.Content = NavContent;

export default Nav;
