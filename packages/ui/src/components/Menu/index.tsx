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
      <RadixMenu.Content className="w-56 rounded-md bg-white dark:bg-black shadow-lg shadow-stone-200 dark:shadow-stone-700 focus:outline-none p-2 z-10">
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
            'focus:bg-stone-100 focus:dark:bg-stone-800 focus-visible:outline-none',
            disabled ? 'cursor-not-allowed opacity-50' : '',
            'select-none text-sm text-stone-800 dark:text-stone-300 px-4 py-1 w-full rounded-md text-left flex gap-2 items-center',
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
          'focus:bg-stone-100 focus:dark:bg-stone-800 focus-visible:outline-none',
          disabled ? 'cursor-not-allowed opacity-50' : undefined,
          'select-none text-sm text-stone-800 dark:text-stone-300 px-4 py-1 w-full rounded-md text-left flex gap-2 items-center',
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
