import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Form } from 'react-final-form';
import TagsInput from '.';

export default {
  component: TagsInput,
} as ComponentMeta<typeof TagsInput>;

const Template: ComponentStory<typeof TagsInput> = args => (
  <Form onSubmit={() => null}>
    {({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <TagsInput name="input" {...args} />
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
