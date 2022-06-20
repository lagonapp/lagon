import { ComponentStory, ComponentMeta } from '@storybook/react';
import LogLine from '.';

export default {
  component: LogLine,
} as ComponentMeta<typeof LogLine>;

const Template: ComponentStory<typeof LogLine> = args => (
  <LogLine date="Today" message="This is a log content" {...args} />
);

export const Default = Template.bind({});

export const Multiple: ComponentStory<typeof LogLine> = () => (
  <div className="flex flex-col">
    <LogLine date="Today" message="This is a log content" />
    <LogLine date="Today" message="This is a log content" />
    <LogLine date="Today" message="This is a log content" />
    <LogLine date="Today" message="This is a log content" />
    <LogLine date="Today" message="This is a log content" />
    <LogLine date="Today" message="This is a log content" />
  </div>
);

export const Error = Template.bind({});
Error.args = {
  level: 'error',
};

export const Warn = Template.bind({});
Warn.args = {
  level: 'warn',
};
