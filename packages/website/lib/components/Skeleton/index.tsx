type SkeletonProps = {
  variant: 'card' | 'log';
};

const Skeleton = ({ variant }: SkeletonProps) => {
  if (variant === 'card') {
    return (
      <div className="flex flex-col gap-2">
        <div className={`p-4 rounded-md border border-gray-200 flex flex-col gap-6 animate-pulse`}>
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
          <div className="h-3 w-1/4 bg-gray-200 rounded" />
          <div className="h-3 w-10/12 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'log') {
    return (
      <div className="flex flex-col animate-pulse gap-2">
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-10/12 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 w-1/4 bg-gray-200 rounded" />
        <div className="h-3 w-4/5 bg-gray-200 rounded" />
      </div>
    );
  }

  return null;
};

export default Skeleton;
