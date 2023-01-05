import { getCurrentDomain, getFullCurrentDomain, getFullDomain } from 'lib/utils';
import { Link } from '@lagon/ui';
import { MouseEventHandler } from 'react';

type FunctionLinksProps = {
  func?: {
    name: string;
    domains: string[];
  };
  onClick?: MouseEventHandler<HTMLDivElement> | undefined;
};

const FunctionLinks = ({ func, onClick }: FunctionLinksProps) => {
  if (!func) {
    return null;
  }

  return (
    <div onClick={onClick} className="flex gap-4 overflow-x-scroll md:overflow-x-auto">
      <Link href={getFullCurrentDomain(func)} target="_blank">
        {getCurrentDomain(func)}
      </Link>
      {func.domains.map(domain => (
        <Link key={domain} href={getFullDomain(domain)} target="_blank">
          {domain}
        </Link>
      ))}
    </div>
  );
};

export default FunctionLinks;
