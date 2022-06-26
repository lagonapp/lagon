import { Menu as HeadlessMenu } from '@headlessui/react';
import { useRouter } from 'next/router';
import { MouseEventHandler, ReactElement, ReactNode } from 'react';

const Menu = ({ children, ...props }) => {
  return (
    <HeadlessMenu as="div" className="relative" {...props}>
      {children}
    </HeadlessMenu>
  );
};

const MenuButton = ({ children, ...props }) => {
  return (
    <HeadlessMenu.Button as="div" {...props}>
      {children}
    </HeadlessMenu.Button>
  );
};

const MenuItems = ({ children, ...props }) => {
  return (
    <HeadlessMenu.Items
      className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg shadow-stone-200 focus:outline-none p-2 z-10"
      {...props}
    >
      {children}
    </HeadlessMenu.Items>
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
  const router = useRouter();

  if (href) {
    return (
      <HeadlessMenu.Item>
        {({ active }) => (
          <a
            href={href}
            onClick={event => {
              event.preventDefault();
              router.push(href);
            }}
            className={`${active ? 'bg-stone-100' : ''} ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            } text-sm text-stone-800 px-4 py-1 w-full rounded-md text-left flex gap-2 items-center`}
          >
            {icon}
            {children}
          </a>
        )}
      </HeadlessMenu.Item>
    );
  }

  return (
    <HeadlessMenu.Item>
      {({ active }) => (
        <button
          type="button"
          onClick={onClick}
          className={`${active ? 'bg-stone-100' : ''} ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          } text-sm text-stone-800 px-4 py-1 w-full rounded-md text-left flex gap-2 items-center`}
        >
          {icon}
          {children}
        </button>
      )}
    </HeadlessMenu.Item>
  );
};

Menu.Button = MenuButton;
Menu.Items = MenuItems;
Menu.Item = MenuItem;

export default Menu;
