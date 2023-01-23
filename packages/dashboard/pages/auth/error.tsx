import { Text, Card, Button } from '@lagon/ui';
import { useI18n } from 'locales';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const Error = () => {
  const { scopedT } = useI18n();
  const t = scopedT('signin.error');
  const { query, push } = useRouter();
  const error = (query.error as string) ?? 'Unknown error';
  const { status } = useSession();

  if (status === 'authenticated') {
    push('/');
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-stone-50 dark:bg-stone-800">
      <Card>
        <div className="w-80 flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Text size="xl">{t('title')}</Text>
            <Text>
              {error === 'AccessDenied'
                ? t('description.notAuthorized')
                : t('description', {
                    error,
                  })}
            </Text>
          </div>
          {error === 'AccessDenied' ? (
            <Button variant="primary" href="https://tally.so/r/n9q1Rp">
              {t('joinWaitlist')}
            </Button>
          ) : (
            <Button
              onClick={() =>
                signIn('github', {
                  callbackUrl: '/',
                })
              }
            >
              {t('github')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

Error.title = 'Sign in';
Error.anonymous = true;

export default Error;
