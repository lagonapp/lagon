import { ComponentStory, ComponentMeta } from '@storybook/react';
import Divider from '.';

export default {
  component: Divider,
} as ComponentMeta<typeof Divider>;

const Template: ComponentStory<typeof Divider> = args => <Divider {...args} />;

export const Default = Template.bind({});
