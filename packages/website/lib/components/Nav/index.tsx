import { ComponentProps, ReactElement, ReactNode } from 'react';
import * as Tabs from '@radix-ui/react-tabs';

type NavListProps = {
  rightItem?: ReactElement;
  children: ReactNode;
};

const NavList = ({ rightItem, children }: NavListProps) => {
  return (
    <Tabs.List className="flex items-center justify-between border-b border-b-stone-200 mb-8">
      <div className="flex -mb-[2px] gap-2">{children}</div>
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
    <Tabs.Trigger value={value} className="px-4 py-2 text-base transition text-stone-500 hover:text-stone-800">
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
  return (
    <Tabs.Root defaultValue={defaultValue} orientation={orientation}>
      {children}
    </Tabs.Root>
  );
};

Nav.List = NavList;
Nav.Link = NavLink;
Nav.Content = NavContent;

export default Nav;
