import { useQueryClient } from '@tanstack/react-query';
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
import { trpc } from 'lib/trpc';
import { reloadSession } from 'lib/utils';
import { getLocaleProps, useI18n } from 'locales';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const New = () => {
  const router = useRouter();
  const createOrganization = trpc.organizationCreate.useMutation();
  const queryClient = useQueryClient();
  const { scopedT } = useI18n();
  const t = scopedT('new');

  return (
    <Form
      onSubmit={async ({ name, description }) => {
        await createOrganization.mutateAsync({
          name,
          description,
        });
      }}
      onSubmitSuccess={() => {
        toast.success(t('success'));

        queryClient.refetchQueries();
        reloadSession();
        router.push('/');
      }}
    >
      <div className="flex flex-col gap-8 w-96 mx-auto mt-12">
        <div className="flex flex-col gap-2">
          <Text>{t('name.title')}</Text>
          <Input
            name="name"
            placeholder={t('name.placeholder')}
            disabled={createOrganization.isLoading}
            validator={composeValidators(
              requiredValidator,
              minLengthValidator(ORGANIZATION_NAME_MIN_LENGTH),
              maxLengthValidator(ORGANIZATION_NAME_MAX_LENGTH),
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Text>{t('description.title')}</Text>
          <Textarea
            name="description"
            placeholder={t('description.placeholder')}
            disabled={createOrganization.isLoading}
            validator={maxLengthValidator(ORGANIZATION_DESCRIPTION_MAX_LENGTH)}
          />
        </div>
        <Button variant="primary" center submit disabled={createOrganization.isLoading}>
          {t('submit')}
        </Button>
      </div>
    </Form>
  );
};

New.title = 'Create Organization';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default New;
