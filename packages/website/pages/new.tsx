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
import { fetchApi, reloadSession } from 'lib/utils';
import { useRouter } from 'next/router';
import { useState } from 'react';
import toast from 'react-hot-toast';

const New = () => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Layout title="Create Organization">
      <Form
        onSubmit={async ({ name, description }) => {
          setIsCreating(true);

          await fetchApi(`/api/organizations`, {
            method: 'POST',
            body: JSON.stringify({ name, description }),
          });
        }}
        onSubmitSuccess={() => {
          setIsCreating(false);
          toast.success('Organization created.');

          reloadSession();
          router.push('/');
        }}
        onSubmitError={() => {
          setIsCreating(false);
        }}
      >
        <div className="flex flex-col gap-8 w-96 mx-auto mt-12">
          <div className="flex flex-col gap-2">
            <Text>Name</Text>
            <Input
              name="name"
              placeholder="awesome-project"
              disabled={isCreating}
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
              disabled={isCreating}
              validator={maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH)}
            />
          </div>
          <Button variant="primary" center submit disabled={isCreating}>
            Create Organization
          </Button>
        </div>
      </Form>
    </Layout>
  );
};

export default New;
