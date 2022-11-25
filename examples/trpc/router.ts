import { initTRPC } from '@trpc/server';

export const t = initTRPC.context().create();

export const appRouter = t.router({
  hello: t.procedure.query(() => ({
    message: 'Hello from tRPC + Lagon!',
  })),
});

export type AppRouter = typeof appRouter;
