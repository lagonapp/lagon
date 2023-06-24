import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Banner } from '../';

export default {
  component: Banner,
} as ComponentMeta<typeof Banner>;

const Template: ComponentStory<typeof Banner> = args => <Banner {...args}>This is a banner</Banner>;

export const Default = Template.bind({});

export const Success = Template.bind({});
Success.args = {
  variant: 'success',
};

export const Warn = Template.bind({});
Warn.args = {
  variant: 'warn',
};

export const Error = Template.bind({});
Error.args = {
  variant: 'error',
};
