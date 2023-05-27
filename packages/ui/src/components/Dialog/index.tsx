import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ComponentProps, ReactElement, ReactNode, useState } from 'react';
import { Button, Form, Text } from '../';

const Cancel = ({ ...props }: Omit<ComponentProps<typeof Button>, 'children'>) => {
  return (
    <AlertDialog.Cancel asChild>
      <Button {...props}>Cancel</Button>
    </AlertDialog.Cancel>
  );
};

type ActionProps = {
  children: string;
} & Omit<ComponentProps<typeof Button>, 'onClick'>;

const Action = ({ children, variant = 'primary', ...props }: ActionProps) => {
  return (
    <Button variant={variant} {...props} submit>
      {children}
    </Button>
  );
};

type ButtonsProps = {
  children: ReactNode;
};

const Buttons = ({ children }: ButtonsProps) => {
  return <div className="mt-6 flex items-center justify-end gap-2">{children}</div>;
};

type DialogProps = {
  title: string;
  description?: string;
  disclosure: ReactElement;
  onSubmit: ComponentProps<typeof Form>['onSubmit'];
  onSubmitSuccess?: ComponentProps<typeof Form>['onSubmitSuccess'];
  children: ReactNode;
};

export const Dialog = ({ title, description, disclosure, onSubmit, onSubmitSuccess, children }: DialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{disclosure}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="animate-fade fixed inset-0 bg-stone-900/40" />
        <AlertDialog.Content className="animate-fade-translate fixed left-[50%] top-[50%] w-[28rem] -translate-x-[50%] -translate-y-[50%] transform rounded-md bg-white p-4 shadow-xl dark:bg-black">
          <Form
            onSubmit={onSubmit}
            onSubmitSuccess={(...values) => {
              onSubmitSuccess?.(...values);

              setOpen(false);
            }}
          >
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
          </Form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

Dialog.Buttons = Buttons;
Dialog.Cancel = Cancel;
Dialog.Action = Action;
