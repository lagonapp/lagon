import { Text, Card, Button } from '@lagon/ui';
import { GitHubIcon } from 'lib/components/GitHubIcon';
// import { GoogleIcon } from 'lib/components/GoogleIcon';
import { useScopedI18n } from 'locales';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';

const SignIn = () => {
  const t = useScopedI18n('signin');
  const { push } = useRouter();
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (status === 'authenticated') {
    push('/');
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-stone-50 dark:bg-stone-800">
      <Card>
        <div className="flex w-64 flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Text size="xl">{t('title')}</Text>
            <Text>{t('description')}</Text>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              leftIcon={<GitHubIcon className="h-4 w-4" />}
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true);
                signIn('github', {
                  callbackUrl: '/',
                });
              }}
            >
              {t('github')}
            </Button>
            {/* <Button
              leftIcon={<GoogleIcon className="h-4 w-4" />}
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true);
                signIn('google', {
                  callbackUrl: '/',
                });
              }}
            >
              {t('google')}
            </Button> */}
          </div>
        </div>
      </Card>
    </div>
  );
};

SignIn.title = 'Sign in';
SignIn.anonymous = true;

export default SignIn;
