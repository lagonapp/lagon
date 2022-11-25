import { TrashIcon, UserAddIcon } from '@heroicons/react/outline';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import Menu from '.';
import Divider from 'lib/components/Divider';

export default {
  component: Menu,
} as ComponentMeta<typeof Menu>;

export const Default: ComponentStory<typeof Menu> = () => (
  <div className="w-64 h-32 flex flex-row-reverse">
    <Menu>
      <Menu.Button>Trigger</Menu.Button>
      <Menu.Items>
        <Menu.Item>Menu item</Menu.Item>
        <Menu.Item>Menu item</Menu.Item>
      </Menu.Items>
    </Menu>
  </div>
);

export const WithIcons: ComponentStory<typeof Menu> = () => (
  <div className="w-64 h-32 flex flex-row-reverse">
    <Menu>
      <Menu.Button>Trigger</Menu.Button>
      <Menu.Items>
        <Menu.Item icon={<UserAddIcon className="w-4 h-4" />}>Menu item</Menu.Item>
        <Menu.Item icon={<TrashIcon className="w-4 h-4" />}>Menu item</Menu.Item>
      </Menu.Items>
    </Menu>
  </div>
);

export const WithDivider: ComponentStory<typeof Menu> = () => (
  <div className="w-64 h-32 flex flex-row-reverse">
    <Menu>
      <Menu.Button>Trigger</Menu.Button>
      <Menu.Items>
        <Menu.Item>Menu item</Menu.Item>
        <Divider />
        <Menu.Item>Menu item</Menu.Item>
      </Menu.Items>
    </Menu>
  </div>
);
