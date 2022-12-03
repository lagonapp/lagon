import { ComponentStory, ComponentMeta } from '@storybook/react';
import { EmptyState, Button } from '../';

export default {
  component: EmptyState,
} as ComponentMeta<typeof EmptyState>;

export const Default: ComponentStory<typeof EmptyState> = () => (
  <EmptyState title="Title" description="This is the empty state description." />
);

export const Action: ComponentStory<typeof EmptyState> = () => (
  <EmptyState
    title="Title"
    description="This is the empty state description with an action."
    action={<Button variant="primary">Action</Button>}
  />
);
