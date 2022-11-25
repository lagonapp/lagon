import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Form } from 'react-final-form';
import Input from '.';

export default {
  component: Input,
} as ComponentMeta<typeof Input>;

const Template: ComponentStory<typeof Input> = args => (
  <Form onSubmit={() => undefined}>
    {({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <Input {...args} name="input" />
      </form>
    )}
  </Form>
);

export const Default = Template.bind({});

export const Placeholder = Template.bind({});
Placeholder.args = {
  placeholder: 'A placeholder',
};

export const TypePassword = Template.bind({});
TypePassword.args = {
  type: 'password',
};

export const TypeNumber = Template.bind({});
TypeNumber.args = {
  type: 'number',
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
};
