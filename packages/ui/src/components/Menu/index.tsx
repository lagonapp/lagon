import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { cx } from 'class-variance-authority';
import Link from 'next/link';
import { MouseEventHandler, ReactElement, ReactNode } from 'react';

type MenuProps = {
  children: ReactNode;
};

export const Menu = ({ children }: MenuProps) => {
  return <RadixMenu.Root>{children}</RadixMenu.Root>;
};

type MenuButtonProps = {
  children: ReactNode;
};

const MenuButton = ({ children }: MenuButtonProps) => {
  return <RadixMenu.Trigger>{children}</RadixMenu.Trigger>;
};

type MenuItemsProps = {
  children: ReactNode;
};

const MenuItems = ({ children }: MenuItemsProps) => {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content className="z-10 w-56 rounded-md bg-white p-2 shadow-lg shadow-stone-200 focus:outline-none dark:bg-black dark:shadow-none">
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
};

type MenuItemProps = {
  icon?: ReactElement;
  href?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler;
  children: ReactNode;
};

const MenuItem = ({ icon, href, disabled, onClick, children }: MenuItemProps) => {
  if (href) {
    return (
      <RadixMenu.Item asChild>
        <Link
          href={href}
          className={cx([
            'focus:bg-stone-100 focus-visible:outline-none focus:dark:bg-stone-800',
            disabled && 'cursor-not-allowed opacity-50',
            'flex w-full select-none items-center gap-2 rounded-md px-4 py-1 text-left text-sm text-stone-800 dark:text-stone-300',
          ])}
        >
          {icon}
          {children}
        </Link>
      </RadixMenu.Item>
    );
  }

  return (
    <RadixMenu.Item asChild>
      <button
        type="button"
        onClick={onClick}
        className={cx([
          'focus:bg-stone-100 focus-visible:outline-none focus:dark:bg-stone-800',
          disabled && 'cursor-not-allowed opacity-50',
          'flex w-full select-none items-center gap-2 rounded-md px-4 py-1 text-left text-sm text-stone-800 dark:text-stone-300',
        ])}
      >
        {icon}
        {children}
      </button>
    </RadixMenu.Item>
  );
};

Menu.Button = MenuButton;
Menu.Items = MenuItems;
Menu.Item = MenuItem;
