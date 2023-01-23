import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';

type AuthGuardProps = {
  children: ReactElement;
};

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status } = useSession();
  const { push, asPath } = useRouter();

  const shouldRedirectToSignIn = status === 'unauthenticated' && !asPath.startsWith('/auth');

  useEffect(() => {
    if (shouldRedirectToSignIn) {
      push('/auth/signin');
    }
  }, [shouldRedirectToSignIn, push]);

  if (status === 'loading' || shouldRedirectToSignIn) {
    return (
      <div className="w-screen h-screen flex justify-center items-center">
        <svg
          className="animate-spin h-8  w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return children;
};

export default AuthGuard;
