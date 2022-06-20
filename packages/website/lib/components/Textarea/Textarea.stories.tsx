import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Form } from 'react-final-form';
import Textarea from '.';

export default {
  component: Textarea,
} as ComponentMeta<typeof Textarea>;

const Template: ComponentStory<typeof Textarea> = args => (
  <Form onSubmit={() => null}>
    {({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <Textarea name="input" {...args} />
      </form>
    )}
  </Form>
);

export const Default = Template.bind({});

export const Placeholder = Template.bind({});
Placeholder.args = {
  placeholder: 'A placeholder',
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};
