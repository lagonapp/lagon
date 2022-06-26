import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSWRConfig } from 'swr';
import { GetFunctionResponse } from 'pages/api/organizations/[organizationId]/functions/[functionId]';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import EmptyState from 'lib/components/EmptyState';
import Link from 'lib/components/Link';
import Text from 'lib/components/Text';
import { getCurrentDomain, getFullCurrentDomain } from 'lib/utils';
import Dialog from 'lib/components/Dialog';

type FunctionDeploymentsProps = {
  func: GetFunctionResponse;
};

const FunctionDeployments = ({ func }: FunctionDeploymentsProps) => {
  const { data: session } = useSession();
  const { mutate } = useSWRConfig();

  const deleteDeployment = useCallback(
    async (deployment: { id: string }) => {
      await fetch(
        `/api/organizations/${session.organization.id}/functions/${func.id}/deploy?deploymentId=${deployment.id}`,
        {
          method: 'DELETE',
        },
      );

      await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
      toast.success('Deployment deleted successfully.');
    },
    [session.organization.id, func.id, mutate],
  );

  const rollbackDeployment = useCallback(
    async (deployment: { id: string }) => {
      await fetch(
        `/api/organizations/${session.organization.id}/functions/${func.id}/deploy?deploymentId=${deployment.id}`,
        {
          method: 'PATCH',
        },
      );

      await mutate(`/api/organizations/${session.organization.id}/functions/${func.id}`);
      toast.success('Deployment rollbacked successfully.');
    },
    [session.organization.id, func.id, mutate],
  );

  return (
    <div className="flex gap-4 flex-col">
      {func.deployments.length === 0 ? (
        <EmptyState
          title="No deployments found"
          description="Create your first deployment from the Playground or with the CLI."
          action={
            <Button variant="primary" href={`/playground/${func.id}`}>
              Go to Playground
            </Button>
          }
        />
      ) : null}
      {func.deployments.map(deployment => {
        const date = new Date(deployment.createdAt);
        date.setHours(date.getHours() - date.getTimezoneOffset() / 60);

        return (
          <Card key={deployment.id}>
            <div className="relative flex justify-between items-center">
              {deployment.isCurrent ? (
                <span className="absolute -top-5 -left-5 text-xs bg-blue-500 text-white px-1 rounded">
                  Current deployment
                </span>
              ) : null}
              <div className="w-1/3">
                <Link href={getFullCurrentDomain({ name: deployment.id })} target="_blank">
                  {getCurrentDomain({ name: deployment.id })}
                </Link>
                <Text size="sm">
                  {date.toLocaleString('en-US', {
                    minute: 'numeric',
                    hour: 'numeric',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </div>
              <div>
                <Text>{deployment.commit || 'No commit linked'}</Text>
                <Text>By: {deployment.triggerer}</Text>
              </div>
              <div className="flex gap-2 justify-end w-1/3">
                {!deployment.isCurrent ? (
                  <>
                    <Dialog
                      title="Rollback Deployment"
                      description="Are you sure you want to rollback to this Deployment?"
                      disclosure={<Button>Rollback</Button>}
                    >
                      <Dialog.Buttons>
                        <Dialog.Cancel />
                        <Dialog.Action onClick={() => rollbackDeployment(deployment)}>Rollback</Dialog.Action>
                      </Dialog.Buttons>
                    </Dialog>
                    <Dialog
                      title="Delete Deployment"
                      description="Are you sure you want to delete this Deployment?"
                      disclosure={<Button variant="danger">Delete</Button>}
                    >
                      <Dialog.Buttons>
                        <Dialog.Cancel />
                        <Dialog.Action variant="danger" onClick={() => deleteDeployment(deployment)}>
                          Delete
                        </Dialog.Action>
                      </Dialog.Buttons>
                    </Dialog>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default FunctionDeployments;
