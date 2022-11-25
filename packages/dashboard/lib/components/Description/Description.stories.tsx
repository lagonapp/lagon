import { ComponentStory, ComponentMeta } from '@storybook/react';
import Description from '.';

export default {
  component: Description,
} as ComponentMeta<typeof Description>;

export const Default: ComponentStory<typeof Description> = () => <Description title="Title">Content</Description>;

export const Total: ComponentStory<typeof Description> = () => (
  <Description title="Title" total="100%">
    50%
  </Description>
);
