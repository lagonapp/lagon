import { useCallback } from 'react';
import toast from 'react-hot-toast';
import Button from 'lib/components/Button';
import Card from 'lib/components/Card';
import EmptyState from 'lib/components/EmptyState';
import Link from 'lib/components/Link';
import Text from 'lib/components/Text';
import { getCurrentDomain, getFullCurrentDomain } from 'lib/utils';
import Dialog from 'lib/components/Dialog';
import { RefreshIcon } from '@heroicons/react/outline';
import { trpc } from 'lib/trpc';
import useFunction from 'lib/hooks/useFunction';
import { QueryObserverBaseResult } from 'react-query';

type FunctionDeploymentsProps = {
  func: ReturnType<typeof useFunction>['data'];
  refetch: QueryObserverBaseResult['refetch'];
};

const FunctionDeployments = ({ func, refetch }: FunctionDeploymentsProps) => {
  const deleteDeployment = trpc.useMutation(['deployments.delete']);
  const currentDeployment = trpc.useMutation(['deployments.current']);

  const removeDeplomyent = useCallback(
    async (deployment: { id: string }) => {
      await deleteDeployment.mutateAsync({
        functionId: func?.id || '',
        deploymentId: deployment.id,
      });

      await refetch();
      toast.success('Deployment deleted successfully.');
    },
    [func?.id, deleteDeployment, refetch],
  );

  const rollbackDeployment = useCallback(
    async (deployment: { id: string }) => {
      await currentDeployment.mutateAsync({
        functionId: func?.id || '',
        deploymentId: deployment.id,
      });

      await refetch();
      toast.success('Deployment rollbacked successfully.');
    },
    [func?.id, currentDeployment, refetch],
  );

  return (
    <div className="flex gap-4 flex-col">
      {!func || func.deployments.length === 0 ? (
        <EmptyState
          title="No deployments found"
          description="Create your first deployment from the Playground or with the CLI."
          action={
            <Button variant="primary" href={`/playground/${func?.id}`}>
              Go to Playground
            </Button>
          }
        />
      ) : null}
      {func?.deployments.map(deployment => {
        const date = new Date(deployment.createdAt);
        date.setHours(date.getHours() - date.getTimezoneOffset() / 60);

        return (
          <Card key={deployment.id}>
            <div className="relative flex flex-col md:flex-row items-start justify-between gap-4 md:gap-0 md:items-center">
              {deployment.isCurrent ? (
                <span className="absolute -top-5 -left-5 text-xs bg-blue-500 text-white px-1 rounded">
                  Current deployment
                </span>
              ) : null}
              <div className="md:w-1/3">
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
              <div className="flex gap-2 md:justify-end md:w-1/3">
                {!deployment.isCurrent ? (
                  <>
                    <Dialog
                      title="Rollback Deployment"
                      description="Are you sure you want to rollback to this Deployment?"
                      disclosure={
                        <Button leftIcon={<RefreshIcon className="w-4 h-4" />} disabled={deleteDeployment.isLoading}>
                          Rollback
                        </Button>
                      }
                    >
                      <Dialog.Buttons>
                        <Dialog.Cancel />
                        <Dialog.Action onClick={() => rollbackDeployment(deployment)}>Rollback</Dialog.Action>
                      </Dialog.Buttons>
                    </Dialog>
                    <Dialog
                      title="Delete Deployment"
                      description="Are you sure you want to delete this Deployment?"
                      disclosure={
                        <Button variant="danger" disabled={deleteDeployment.isLoading}>
                          Delete
                        </Button>
                      }
                    >
                      <Dialog.Buttons>
                        <Dialog.Cancel disabled={deleteDeployment.isLoading} />
                        <Dialog.Action
                          variant="danger"
                          onClick={() => removeDeplomyent(deployment)}
                          disabled={deleteDeployment.isLoading}
                        >
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
