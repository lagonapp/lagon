import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ComponentProps, ReactElement, ReactNode } from 'react';
import Button from '../Button';
import Text from '../Text';

const Cancel = () => {
  return (
    <AlertDialog.Cancel>
      <Button>Cancel</Button>
    </AlertDialog.Cancel>
  );
};

type ActionProps = {
  variant?: ComponentProps<typeof Button>['variant'];
  children: string;
};

const Action = ({ variant = 'primary', children }: ActionProps) => {
  return (
    <AlertDialog.Action>
      <Button variant={variant}>{children}</Button>
    </AlertDialog.Action>
  );
};

type ButtonsProps = {
  children: ReactNode;
};

const Buttons = ({ children }: ButtonsProps) => {
  return <div className="flex justify-end items-center mt-4">{children}</div>;
};

type DialogProps = {
  title: string;
  description?: string;
  disclosure: ReactElement;
  children: ReactNode;
};

const Dialog = ({ title, description, disclosure, children }: DialogProps) => {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>{disclosure}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="bg-gray-900/20 fixed inset-0" />
        <AlertDialog.Content className="bg-white w-96 p-4 fixed top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] rounded-md shadow-md">
          <div className="mb-4">
            <AlertDialog.Title className="mb-1">
              <Text size="xl">{title}</Text>
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description>
                <Text>{description}</Text>
              </AlertDialog.Description>
            ) : null}
          </div>
          {children}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

Dialog.Buttons = Buttons;
Dialog.Cancel = Cancel;
Dialog.Action = Action;

export default Dialog;
