import { ComponentStory, ComponentMeta } from '@storybook/react';
import Skeleton from '.';

export default {
  component: Skeleton,
} as ComponentMeta<typeof Skeleton>;

export const Card: ComponentStory<typeof Skeleton> = () => <Skeleton variant="card" />;

export const Log: ComponentStory<typeof Skeleton> = () => <Skeleton variant="log" />;
