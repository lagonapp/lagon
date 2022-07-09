import Button from 'lib/components/Button';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import Text from 'lib/components/Text';
import Textarea from 'lib/components/Textarea';
import {
  ORGANIZATION_DESCRIPTION_MAX_LENGTH,
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from 'lib/constants';
import { composeValidators, maxLengthValidator, minLengthValidator, requiredValidator } from 'lib/form/validators';
import Layout from 'lib/Layout';
import { trpc } from 'lib/trpc';
import { reloadSession } from 'lib/utils';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const New = () => {
  const router = useRouter();
  const createOrganization = trpc.useMutation(['organizations.create']);
  const queryContext = trpc.useContext();

  return (
    <Form
      onSubmit={async ({ name, description }) => {
        await createOrganization.mutateAsync({
          name,
          description,
        });
      }}
      onSubmitSuccess={() => {
        toast.success('Organization created.');

        queryContext.refetchQueries();
        reloadSession();
        router.push('/');
      }}
    >
      <div className="flex flex-col gap-8 w-96 mx-auto mt-12">
        <div className="flex flex-col gap-2">
          <Text>Name</Text>
          <Input
            name="name"
            placeholder="awesome-project"
            disabled={createOrganization.isLoading}
            validator={composeValidators(
              requiredValidator,
              minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
              maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text>Description</Text>
          <Textarea
            name="description"
            placeholder="Description of my new awesome project."
            disabled={createOrganization.isLoading}
            validator={maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH)}
          />
        </div>
        <Button variant="primary" center submit disabled={createOrganization.isLoading}>
          Create Organization
        </Button>
      </div>
    </Form>
  );
};

New.title = 'Create Organization';

export default New;
