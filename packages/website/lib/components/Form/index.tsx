import { FormApi } from 'final-form';
import { ReactNode } from 'react';
import { Form as FinalFormForm, FormProps as FinalFormFormProps, FormRenderProps } from 'react-final-form';
import toast from 'react-hot-toast';

type FormProps = {
  initialValues?: FinalFormFormProps['initialValues'];
  onSubmit: FinalFormFormProps['onSubmit'];
  onSubmitSuccess: FinalFormFormProps['onSubmit'];
  onSubmitError?: FinalFormFormProps['onSubmit'];
  children:
    | ReactNode
    | (({
        handleSubmit,
        form,
        values,
      }: {
        handleSubmit: FormRenderProps['handleSubmit'];
        form: FormApi;
        values: Record<string, any>;
      }) => ReactNode);
};

const Form = ({ initialValues, onSubmit, onSubmitSuccess, onSubmitError, children }: FormProps) => {
  return (
    <FinalFormForm
      initialValues={initialValues}
      onSubmit={async (values, form, callback) => {
        try {
          await onSubmit(values, form, callback);
          await onSubmitSuccess(values, form, callback);
        } catch (error) {
          toast.error((error as Error).message || 'An error occured.');
          await onSubmitError?.(values, form, callback);
        }
      }}
    >
      {({ handleSubmit, form, values }) => (
        <form onSubmit={handleSubmit}>
          {typeof children === 'function' ? children({ handleSubmit, form, values }) : children}
        </form>
      )}
    </FinalFormForm>
  );
};

export default Form;
