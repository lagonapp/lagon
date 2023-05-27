import { Card, Text, Input, Button, Form, Dialog, Divider, Skeleton } from '@lagon/ui';
import { composeValidators, emailValidator, requiredValidator } from 'lib/form/validators';
import useOrganizationMembers from 'lib/hooks/useOrganizationMembers';
import { trpc } from 'lib/trpc';
import { useScopedI18n } from 'locales';
import { useSession } from 'next-auth/react';
import { Suspense } from 'react';
import toast from 'react-hot-toast';

const Members = () => {
  const t = useScopedI18n('settings.members');
  const { data: session } = useSession();
  const { data: organizationMembers, refetch } = useOrganizationMembers();

  const isOrganizationOwner = session?.user.id === organizationMembers?.owner.id;
  const organizationRemoveMember = trpc.organizationRemoveMember.useMutation();

  const removeMember = async (userId: string) => {
    await organizationRemoveMember.mutateAsync({
      userId,
    });

    await refetch();

    toast.success(t('remove.success'));
  };

  return (
    <>
      <Divider />
      <div className="flex items-center justify-between gap-4 px-4">
        <Text strong={isOrganizationOwner}>{organizationMembers?.owner.email}</Text>
        <Text size="sm">
          {t('joined')}&nbsp;
          {new Date(session?.organization.createdAt ?? 0).toLocaleString('en-US', {
            minute: 'numeric',
            hour: 'numeric',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text size="sm">{t('owner')}</Text>
        <Button variant="danger" disabled>
          {t('remove')}
        </Button>
      </div>
      {organizationMembers?.members.map(member => (
        <>
          <Divider />
          <div className="flex items-center justify-between gap-4 px-4" key={member.user.id}>
            <Text strong={member.user.id === session?.user.id}>{member.user.email}</Text>
            <Text size="sm">
              {t('joined')}&nbsp;
              {new Date(member.createdAt).toLocaleString('en-US', {
                minute: 'numeric',
                hour: 'numeric',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text size="sm">{t('member')}</Text>
            <Dialog
              title={t('remove.modal.title')}
              description={t('remove.modal.description', {
                member: member.user.email,
                organization: session?.organization.name,
              })}
              disclosure={
                <Button variant="danger" disabled={!isOrganizationOwner || organizationRemoveMember.isLoading}>
                  {t('remove')}
                </Button>
              }
              onSubmit={async () => {
                await removeMember(member.user.id);
              }}
            >
              <Dialog.Buttons>
                <Dialog.Cancel disabled={organizationRemoveMember.isLoading} />
                <Dialog.Action variant="danger" disabled={organizationRemoveMember.isLoading}>
                  {t('remove.modal.submit')}
                </Dialog.Action>
              </Dialog.Buttons>
            </Dialog>
          </div>
        </>
      ))}
    </>
  );
};

const SettingsMember = () => {
  const t = useScopedI18n('settings');
  const { data: session } = useSession();
  const { data: organizationMembers, refetch } = useOrganizationMembers();

  const isOrganizationOwner = session?.user.id === organizationMembers?.owner.id;
  const organizationAddMember = trpc.organizationAddMember.useMutation();

  return (
    <div className="flex flex-col gap-8">
      <Card
        title={t('members.title')}
        description={t('members.description')}
        rightItem={
          <Dialog
            title={t('members.invite.modal.title')}
            description={t('members.invite.modal.description')}
            disclosure={
              <Button variant="primary" disabled={!isOrganizationOwner}>
                {t('members.invite')}
              </Button>
            }
            onSubmit={async ({ email }) => {
              await organizationAddMember.mutateAsync({
                email,
              });
            }}
            onSubmitSuccess={async () => {
              toast.success(t('members.invite.success'));
              await refetch();
            }}
          >
            <Input
              name="email"
              type="email"
              placeholder="john@doe.com"
              validator={composeValidators(requiredValidator, emailValidator)}
            />
            <Dialog.Buttons>
              <Dialog.Cancel disabled={organizationAddMember.isLoading} />
              <Dialog.Action variant="primary" disabled={organizationAddMember.isLoading}>
                {t('members.invite.modal.submit')}
              </Dialog.Action>
            </Dialog.Buttons>
          </Dialog>
        }
      >
        <div>
          <Suspense fallback={<Skeleton variant="text" />}>
            <Members />
          </Suspense>
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
