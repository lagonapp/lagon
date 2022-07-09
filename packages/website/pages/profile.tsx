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
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { data: session } = useSession();
  const { data: tokens = [], refetch } = useTokens();
  const deleteToken = trpc.useMutation(['tokens.delete']);
  const updateAccount = trpc.useMutation(['accounts.update']);

  const removeToken = useCallback(
    async (token: NonNullable<typeof tokens>[number]) => {
      await deleteToken.mutateAsync({
        tokenId: token.id,
      });

      await refetch();
      toast.success('Token has been deleted.');
    },
    [deleteToken, refetch],
  );

  return (
    <LayoutTitle title="Profile">
      <div className="flex flex-col gap-8">
        <Card title="Information" description="Edit your account information like your name and email.">
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
              toast.success('Information updated successfully.');
            }}
          >
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12 mb-6">
              <div className="flex flex-1 flex-col gap-1">
                <Text size="lg">Name</Text>
                <Input name="name" placeholder="John Doe" validator={requiredValidator} />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Text size="lg">Email</Text>
                <Input name="email" type="email" placeholder="john@doe.com" validator={requiredValidator} />
              </div>
            </div>
            <Button variant="primary" submit>
              Update
            </Button>
          </Form>
        </Card>
        <Card title="Tokens" description="Below are your personal tokens, used for the CLI.">
          <div>
            {tokens?.map(token => (
              <div key={token.id}>
                <Divider />
                <div className="flex items-center justify-between px-4 gap-4">
                  <Text strong>********</Text>
                  <Text size="sm">
                    Created:&nbsp;
                    {new Date(token.createdAt).toLocaleString('en-US', {
                      minute: 'numeric',
                      hour: 'numeric',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Dialog
                    title="Delete token"
                    description="Are you sure you want to delete this token? You will lose access to the CLI if it is still used."
                    disclosure={
                      <Button variant="danger" disabled={deleteToken.isLoading}>
                        Delete
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
                        Delete Token
                      </Dialog.Action>
                    </Dialog.Buttons>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Delete" description="Delete permanentently this account. This action is irreversible." danger>
          <div>
            <Dialog
              title="Delete Account"
              description={`Write your account email to confirm deletion: ${session?.user.email}`}
              disclosure={<Button variant="danger">Delete</Button>}
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
                      validator={value => (value !== session?.user.email ? 'Confirm with the your email' : undefined)}
                    />
                    <Dialog.Buttons>
                      <Dialog.Cancel />
                      <Dialog.Action variant="danger" onClick={handleSubmit}>
                        Delete Account
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

export default Profile;
