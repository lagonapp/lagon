import { Text, Card, Button } from '@lagon/ui';
import { useI18n } from 'locales';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const SignIn = () => {
  const { scopedT } = useI18n();
  const t = scopedT('signin');
  const { push } = useRouter();
  const { status } = useSession();

  if (status === 'authenticated') {
    push('/');
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-stone-50 dark:bg-stone-800">
      <Card>
        <div className="w-64 flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Text size="xl">{t('title')}</Text>
            <Text>{t('description')}</Text>
          </div>
          <Button
            variant="primary"
            onClick={() =>
              signIn('github', {
                callbackUrl: '/',
              })
            }
          >
            {t('github')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

SignIn.title = 'Sign in';
SignIn.anonymous = true;

export default SignIn;
