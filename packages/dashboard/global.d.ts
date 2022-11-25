import 'next-auth';

declare module 'next-auth' {
  interface Session {
    organization: {
      id: string;
      name: string;
      description?: string;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
}
