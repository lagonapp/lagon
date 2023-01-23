import { Text, Card, Button } from '@lagon/ui';
import { useI18n } from 'locales';
import { signIn } from 'next-auth/react';

const SignIn = () => {
  const { scopedT } = useI18n();
  const t = scopedT('signin');

  return (
    <div className="w-screen h-screen flex justify-center items-center">
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
