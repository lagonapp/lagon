import { ComponentStory, ComponentMeta } from '@storybook/react';
import Dialog from '.';
import Button from '../Button';

export default {
  component: Dialog,
} as ComponentMeta<typeof Dialog>;

export const Default: ComponentStory<typeof Dialog> = () => (
  <Dialog title="Example dialog" disclosure={<Button>Trigger</Button>}>
    Dialog content
  </Dialog>
);

export const Description: ComponentStory<typeof Dialog> = () => (
  <Dialog title="Example dialog" description="This is a description" disclosure={<Button>Trigger</Button>}>
    Dialog content
  </Dialog>
);

export const Cancel: ComponentStory<typeof Dialog> = () => (
  <Dialog title="Example dialog" disclosure={<Button>Trigger</Button>}>
    Dialog content
    <Dialog.Buttons>
      <Dialog.Cancel />
    </Dialog.Buttons>
  </Dialog>
);

export const Action: ComponentStory<typeof Dialog> = () => (
  <Dialog title="Example dialog" disclosure={<Button>Trigger</Button>}>
    Dialog content
    <Dialog.Buttons>
      <Dialog.Action>OK</Dialog.Action>
    </Dialog.Buttons>
  </Dialog>
);
