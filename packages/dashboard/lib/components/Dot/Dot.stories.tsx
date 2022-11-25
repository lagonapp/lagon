import { ComponentStory, ComponentMeta } from '@storybook/react';
import Dot from '.';

export default {
  component: Dot,
} as ComponentMeta<typeof Dot>;

export const Default: ComponentStory<typeof Dot> = () => (
  <>
    <Dot status="success" />
    <Dot status="info" />
    <Dot status="danger" />
  </>
);
