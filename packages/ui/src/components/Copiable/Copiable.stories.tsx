import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Copiable } from '..';

export default {
  component: Copiable,
} as ComponentMeta<typeof Copiable>;

export const Default: ComponentStory<typeof Copiable> = () => <Copiable value="Value">Copy me</Copiable>;
