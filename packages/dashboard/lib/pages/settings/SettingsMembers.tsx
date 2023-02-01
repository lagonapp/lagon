import { Card, Text, Input, Button, Form, Dialog, Divider } from '@lagon/ui';
import { useI18n } from 'locales';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const SettingsMember = () => {
  const { scopedT } = useI18n();
  const t = scopedT('settings');
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-8">
      <Card
        title={t('members.title')}
        description={t('members.description')}
        rightItem={
          <Dialog
            title={t('members.invite.modal.title')}
            description={t('members.invite.modal.description')}
            disclosure={<Button variant="primary">{t('members.invite')}</Button>}
          >
            <Form
              // TODO
              onSubmit={async () => null}
              onSubmitSuccess={() => {
                toast.success(t('members.invite.success'));
              }}
            >
              {({ handleSubmit }) => (
                <>
                  <Input name="confirm" type="email" placeholder="john@doe.com" />
                  <Dialog.Buttons>
                    <Dialog.Cancel disabled={false} />
                    <Dialog.Action variant="primary" onClick={handleSubmit} disabled={false}>
                      {t('members.invite.modal.submit')}
                    </Dialog.Action>
                  </Dialog.Buttons>
                </>
              )}
            </Form>
          </Dialog>
        }
      >
        <div>
          <Divider />
          <div className="flex items-center justify-between gap-4 px-4">
            <Text strong>{session?.user?.email}</Text>
            <Text size="sm">
              {t('members.joined')}&nbsp;
              {new Date().toLocaleString('en-US', {
                minute: 'numeric',
                hour: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Button variant="danger" disabled>
              {t('members.remove')}
            </Button>
            {/* TODO: map over the users */}
            {/* <Dialog
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
                <Dialog.Action variant="danger" onClick={() => removeToken(token)} disabled={deleteToken.isLoading}>
                  {t('tokens.delete.modal.submit')}
                </Dialog.Action>
              </Dialog.Buttons>
            </Dialog> */}
          </div>
        </div>
      </Card>
      <Form
        onSubmit={async () => null}
        onSubmitSuccess={() => {
          toast.success(t('transfer.success'));
        }}
      >
        <Card title={t('transfer.title')} description={t('transfer.description')} danger>
          <div className="flex gap-1">
            <Text strong>{t('transfer.notAvailable')}</Text>
            <Text>{t('transfer.notAvailable.description')}</Text>
          </div>
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
            <Input name="email" placeholder={t('transfer.placeholder')} disabled />
            <Button variant="danger" submit disabled>
              {t('transfer.submit')}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default SettingsMember;
