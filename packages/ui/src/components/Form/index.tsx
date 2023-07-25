import { FormApi } from 'final-form';
import { ReactNode } from 'react';
import { Form as FinalFormForm, FormProps as FinalFormFormProps } from 'react-final-form';
import toast from 'react-hot-toast';

type FormProps = {
  initialValues?: FinalFormFormProps['initialValues'];
  onSubmit: FinalFormFormProps['onSubmit'];
  onSubmitSuccess: FinalFormFormProps['onSubmit'];
  onSubmitError?: FinalFormFormProps['onSubmit'];
  children: ReactNode | (({ form, values }: { form: FormApi; values: Record<string, unknown> }) => ReactNode);
};

export const Form = ({ initialValues, onSubmit, onSubmitSuccess, onSubmitError, children }: FormProps) => {
  return (
    <FinalFormForm
      initialValues={initialValues}
      onSubmit={async (values, form, callback) => {
        try {
          await onSubmit(values, form, callback);
          await onSubmitSuccess(values, form, callback);
        } catch (error) {
          toast.error((error as Error).message || 'An error occurred.');
          await onSubmitError?.(values, form, callback);
        }
      }}
      render={({ handleSubmit, form, values }) => (
        <form onSubmit={handleSubmit}>{typeof children === 'function' ? children({ form, values }) : children}</form>
      )}
    />
  );
};
