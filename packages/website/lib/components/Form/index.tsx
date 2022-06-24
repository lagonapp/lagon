import { ReactNode } from 'react';
import { Form as FinalFormForm, FormProps as FinalFormFormProps, FormRenderProps } from 'react-final-form';

type FormProps = {
  initialValues?: FinalFormFormProps['initialValues'];
  onSubmit: FinalFormFormProps['onSubmit'];
  onSubmitSuccess: FinalFormFormProps['onSubmit'];
  onSubmitError: FinalFormFormProps['onSubmit'];
  children: ReactNode | ((handleSubmit: FormRenderProps['handleSubmit']) => ReactNode);
};

const Form = ({ initialValues, onSubmit, onSubmitSuccess, onSubmitError, children }: FormProps) => {
  return (
    <FinalFormForm
      initialValues={initialValues}
      onSubmit={async (values, form, callback) => {
        try {
          await onSubmit(values, form, callback);
          await onSubmitSuccess(values, form, callback);
        } catch {
          await onSubmitError(values, form, callback);
        }
      }}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>{typeof children === 'function' ? children(handleSubmit) : children}</form>
      )}
    </FinalFormForm>
  );
};

export default Form;
