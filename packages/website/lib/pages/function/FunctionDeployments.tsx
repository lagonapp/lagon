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
import { QueryObserverBaseResult } from '@tanstack/react-query';
import { useI18n } from 'locales';

type FunctionDeploymentsProps = {
  func: ReturnType<typeof useFunction>['data'];
  refetch: QueryObserverBaseResult['refetch'];
};

const FunctionDeployments = ({ func, refetch }: FunctionDeploymentsProps) => {
  const { scopedT } = useI18n();
  const t = scopedT('functions.deployments');
  const deleteDeployment = trpc.deploymentDelete.useMutation();
  const currentDeployment = trpc.deploymentCurrent.useMutation();

  const removeDeplomyent = useCallback(
    async (deployment: { id: string }) => {
      await deleteDeployment.mutateAsync({
        functionId: func?.id || '',
        deploymentId: deployment.id,
      });

      await refetch();
      toast.success(t('delete.success'));
    },
    [func?.id, deleteDeployment, refetch, t],
  );

  const rollbackDeployment = useCallback(
    async (deployment: { id: string }) => {
      await currentDeployment.mutateAsync({
        functionId: func?.id || '',
        deploymentId: deployment.id,
      });

      await refetch();
      toast.success(t('rollback.success'));
    },
    [func?.id, currentDeployment, refetch, t],
  );

  return (
    <div className="flex gap-4 flex-col">
      {!func || func.deployments.length === 0 ? (
        <EmptyState
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <Button variant="primary" href={`/playground/${func?.id}`}>
              {t('empty.action')}
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
                  {t('list.current')}
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
                <Text>{deployment.commit || t('list.noCommit')}</Text>
                <Text>
                  {t('list.by')}&nbsp;{deployment.triggerer}
                </Text>
              </div>
              <div className="flex gap-2 md:justify-end md:w-1/3">
                {!deployment.isCurrent ? (
                  <>
                    <Dialog
                      title={t('rollback.modal.title')}
                      description={t('rollback.modal.description')}
                      disclosure={
                        <Button leftIcon={<RefreshIcon className="w-4 h-4" />} disabled={deleteDeployment.isLoading}>
                          {t('rollback')}
                        </Button>
                      }
                    >
                      <Dialog.Buttons>
                        <Dialog.Cancel />
                        <Dialog.Action onClick={() => rollbackDeployment(deployment)}>
                          {t('rollback.modal.submit')}
                        </Dialog.Action>
                      </Dialog.Buttons>
                    </Dialog>
                    <Dialog
                      title={t('delete.modal.title')}
                      description={t('delete.modal.description')}
                      disclosure={
                        <Button variant="danger" disabled={deleteDeployment.isLoading}>
                          {t('delete')}
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
                          {t('delete.modal.submit')}
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
