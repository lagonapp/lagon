import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Divider, Menu } from '../';

export default {
  component: Menu,
} as ComponentMeta<typeof Menu>;

export const Default: ComponentStory<typeof Menu> = () => (
  <Menu>
    <Menu.Button>Trigger</Menu.Button>
    <Menu.Items>
      <Menu.Item>Menu item</Menu.Item>
      <Menu.Item>Menu item</Menu.Item>
    </Menu.Items>
  </Menu>
);

export const WithIcons: ComponentStory<typeof Menu> = () => (
  <Menu>
    <Menu.Button>Trigger</Menu.Button>
    <Menu.Items>
      <Menu.Item icon={<UserPlusIcon className="h-4 w-4" />}>Menu item</Menu.Item>
      <Menu.Item icon={<TrashIcon className="h-4 w-4" />}>Menu item</Menu.Item>
    </Menu.Items>
  </Menu>
);

export const WithDivider: ComponentStory<typeof Menu> = () => (
  <Menu>
    <Menu.Button>Trigger</Menu.Button>
    <Menu.Items>
      <Menu.Item>Menu item</Menu.Item>
      <Divider />
      <Menu.Item>Menu item</Menu.Item>
    </Menu.Items>
  </Menu>
);
