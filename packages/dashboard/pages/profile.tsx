import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Dialog from 'lib/components/Dialog';
import Divider from 'lib/components/Divider';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import LayoutTitle from 'lib/components/LayoutTitle';
import Text from 'lib/components/Text';
import { requiredValidator } from 'lib/form/validators';
import useTokens from 'lib/hooks/useTokens';
import { trpc } from 'lib/trpc';
import { getLocaleProps, useI18n } from 'locales';
import { GetStaticProps } from 'next';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { data: session } = useSession();
  const { data: tokens = [], refetch } = useTokens();
  const deleteToken = trpc.tokensDelete.useMutation();
  const updateAccount = trpc.accountUpdate.useMutation();
  const { scopedT } = useI18n();
  const t = scopedT('profile');

  const removeToken = useCallback(
    async (token: NonNullable<typeof tokens>[number]) => {
      await deleteToken.mutateAsync({
        tokenId: token.id,
      });

      await refetch();
      toast.success(t('tokens.delete.success'));
    },
    [deleteToken, refetch, t],
  );

  return (
    <LayoutTitle title={t('title')}>
      <div className="flex flex-col gap-8">
        <Card title={t('information.title')} description={t('information.description')}>
          <Form
            initialValues={{
              name: session?.user.name,
              email: session?.user.email,
            }}
            onSubmit={async ({ name, email }) => {
              await updateAccount.mutateAsync({
                name,
                email,
              });

              await refetch();
            }}
            onSubmitSuccess={() => {
              toast.success(t('information.success'));
            }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12 mb-6">
              <div className="flex flex-1 flex-col gap-1">
                <Text size="lg">{t('information.name.title')}</Text>
                <Input name="name" placeholder={t('information.name.placeholder')} validator={requiredValidator} />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Text size="lg">{t('information.email.title')}</Text>
                <Input
                  name="email"
                  type="email"
                  placeholder={t('information.email.placeholder')}
                  validator={requiredValidator}
                />
              </div>
            </div>
            <Button variant="primary" submit>
              {t('information.submit')}
            </Button>
          </Form>
        </Card>
        <Card title={t('tokens.title')} description={t('tokens.description')}>
          <div>
            {tokens?.map(token => (
              <div key={token.id}>
                <Divider />
                <div className="flex items-center justify-between px-4 gap-4">
                  <Text strong>********</Text>
                  <Text size="sm">
                    {t('tokens.created')}&nbsp;
                    {new Date(token.createdAt).toLocaleString('en-US', {
                      minute: 'numeric',
                      hour: 'numeric',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Dialog
                    title={t('tokens.delete.modal.title')}
                    description={t('tokens.delete.modal.description')}
                    disclosure={
                      <Button variant="danger" disabled={deleteToken.isLoading}>
                        {t('tokens.delete.submit')}
                      </Button>
                    }
                  >
                    <Dialog.Buttons>
                      <Dialog.Cancel disabled={deleteToken.isLoading} />
                      <Dialog.Action
                        variant="danger"
                        onClick={() => removeToken(token)}
                        disabled={deleteToken.isLoading}
                      >
                        {t('tokens.delete.modal.submit')}
                      </Dialog.Action>
                    </Dialog.Buttons>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title={t('delete.title')} description={t('delete.description')} danger>
          <div>
            <Dialog
              title={t('delete.modal.title')}
              description={t('delete.modal.description', {
                email: session!.user.email,
              })}
              disclosure={<Button variant="danger">{t('delete.submit')}</Button>}
            >
              <Form
                onSubmit={() => {
                  // TODO
                  toast.error('Account deletion is not implemented yet.');
                }}
                onSubmitSuccess={async () => null}
              >
                {({ handleSubmit }) => (
                  <>
                    <Input
                      name="confirm"
                      placeholder={session?.user.email}
                      validator={value => (value !== session?.user.email ? t('delete.modal.confirm') : undefined)}
                    />
                    <Dialog.Buttons>
                      <Dialog.Cancel />
                      <Dialog.Action variant="danger" onClick={handleSubmit}>
                        {t('delete.modal.submit')}
                      </Dialog.Action>
                    </Dialog.Buttons>
                  </>
                )}
              </Form>
            </Dialog>
          </div>
        </Card>
      </div>
    </LayoutTitle>
  );
};

Profile.title = 'Profile';

export const getStaticProps: GetStaticProps = getLocaleProps();

export default Profile;
