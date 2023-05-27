import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Dialog, Button } from '../';

export default {
  component: Dialog,
} as ComponentMeta<typeof Dialog>;

export const Default: ComponentStory<typeof Dialog> = () => (
  <Dialog
    title="Example dialog"
    disclosure={<Button>Trigger</Button>}
    onSubmit={() => {
      console.log('Submit!');
    }}
  >
    Dialog content
  </Dialog>
);

export const Description: ComponentStory<typeof Dialog> = () => (
  <Dialog
    title="Example dialog"
    description="This is a description"
    disclosure={<Button>Trigger</Button>}
    onSubmit={() => {
      console.log('Submit!');
    }}
  >
    Dialog content
  </Dialog>
);

export const Cancel: ComponentStory<typeof Dialog> = () => (
  <Dialog
    title="Example dialog"
    disclosure={<Button>Trigger</Button>}
    onSubmit={() => {
      console.log('Submit!');
    }}
  >
    Dialog content
    <Dialog.Buttons>
      <Dialog.Cancel />
    </Dialog.Buttons>
  </Dialog>
);

export const Action: ComponentStory<typeof Dialog> = () => (
  <Dialog
    title="Example dialog"
    disclosure={<Button>Trigger</Button>}
    onSubmit={() => {
      console.log('Submit!');
    }}
  >
    Dialog content
    <Dialog.Buttons>
      <Dialog.Action>OK</Dialog.Action>
    </Dialog.Buttons>
  </Dialog>
);
