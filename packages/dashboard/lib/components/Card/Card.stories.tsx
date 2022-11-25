import { ComponentStory, ComponentMeta } from '@storybook/react';
import Card from '.';
import Button from 'lib/components/Button';

export default {
  component: Card,
} as ComponentMeta<typeof Card>;

const Template: ComponentStory<typeof Card> = args => <Card {...args}>Card content</Card>;

export const Default = Template.bind({});

export const Clickable = Template.bind({});
Clickable.args = {
  clickable: true,
};

export const Title = Template.bind({});
Title.args = {
  title: 'Card title',
};

export const Description = Template.bind({});
Description.args = {
  title: 'Card title',
  description: 'This is a description for the card component.',
};

export const RightItem = Template.bind({});
RightItem.args = {
  title: 'Card title',
  description: 'Right items needs a title.',
  rightItem: <Button>Right item</Button>,
};

export const FullWidth = Template.bind({});
FullWidth.args = {
  fullWidth: true,
};
