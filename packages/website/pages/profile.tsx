import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import Dialog from 'lib/components/Dialog';
import Divider from 'lib/components/Divider';
import Form from 'lib/components/Form';
import Input from 'lib/components/Input';
import Text from 'lib/components/Text';
import useTokens from 'lib/hooks/useTokens';
import Layout from 'lib/Layout';
import { trpc } from 'lib/trpc';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { data: session } = useSession();
  const { data: tokens, refetch } = useTokens();
  const deleteToken = trpc.useMutation(['tokens.delete']);

  const removeToken = useCallback(
    async (token: typeof tokens[number]) => {
      await deleteToken.mutateAsync({
        tokenId: token.id,
      });

      await refetch();
      toast.success('Token has been deleted.');
    },
    [deleteToken, refetch],
  );

  return (
    <Layout title="Profile">
      <div className="flex flex-col gap-8">
        <Card title="Tokens" description="Below are your personal tokens, used for the CLI.">
          <div>
            {tokens?.map(token => (
              <>
                <Divider />
                <div key={token.id} className="flex items-center justify-between px-4">
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
              </>
            ))}
          </div>
        </Card>
        <Card title="Delete" description="Delete permanentently this account. This action is irreversible." danger>
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
              {handleSubmit => (
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
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
