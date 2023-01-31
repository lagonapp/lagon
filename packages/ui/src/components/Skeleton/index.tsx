type SkeletonProps = {
  variant: 'card' | 'log' | 'text' | 'rect';
};

export const Skeleton = ({ variant }: SkeletonProps) => {
  if (variant === 'card') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex animate-pulse flex-col gap-6 rounded-md p-4">
          <div className="h-3 w-1/2 rounded bg-stone-200 dark:bg-stone-600" />
          <div className="h-3 w-1/4 rounded bg-stone-200 dark:bg-stone-600" />
          <div className="h-3 w-10/12 rounded bg-stone-200 dark:bg-stone-600" />
        </div>
      </div>
    );
  }

  if (variant === 'log') {
    return (
      <div className="flex animate-pulse flex-col gap-2">
        <div className="h-3 w-1/2 rounded bg-stone-200 dark:bg-stone-600" />
        <div className="h-3 w-10/12 rounded bg-stone-200 dark:bg-stone-600" />
        <div className="h-3 rounded bg-stone-200 dark:bg-stone-600" />
        <div className="h-3 w-1/4 rounded bg-stone-200 dark:bg-stone-600" />
        <div className="h-3 w-4/5 rounded bg-stone-200 dark:bg-stone-600" />
      </div>
    );
  }

  if (variant === 'text') {
    return <div className="h-4 animate-pulse rounded bg-stone-200 dark:bg-stone-600" />;
  }

  return null;
};
