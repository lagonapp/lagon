import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ComponentProps, ReactElement, ReactNode } from 'react';
import Button from '../Button';
import Text from '../Text';

const Cancel = ({ ...props }: Omit<ComponentProps<typeof Button>, 'children'>) => {
  return (
    <AlertDialog.Cancel asChild>
      <Button {...props}>Cancel</Button>
    </AlertDialog.Cancel>
  );
};

type ActionProps = {
  children: string;
} & ComponentProps<typeof Button>;

const Action = ({ children, variant = 'primary', ...props }: ActionProps) => {
  return (
    <AlertDialog.Action asChild>
      <Button variant={variant} {...props}>
        {children}
      </Button>
    </AlertDialog.Action>
  );
};

type ButtonsProps = {
  children: ReactNode;
};

const Buttons = ({ children }: ButtonsProps) => {
  return <div className="flex justify-end items-center mt-6 gap-2">{children}</div>;
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
      <AlertDialog.Trigger asChild>{disclosure}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="bg-stone-900/40 fixed inset-0 animate-fade" />
        <AlertDialog.Content className="bg-white dark:bg-black w-[28rem] p-4 fixed top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] rounded-md shadow-xl animate-fade-translate">
          <div className="mb-6">
            <AlertDialog.Title asChild>
              <Text size="xl" className="mb-2">
                {title}
              </Text>
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description asChild>
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
