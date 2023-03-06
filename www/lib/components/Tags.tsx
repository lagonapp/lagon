import { Text } from './Text';

type TagsProps = {
  tags: string[];
};

export const Tags = ({ tags }: TagsProps) => {
  return (
    <div className="flex gap-3">
      {tags.map(tag => (
        <Text size="a" className="text-sm" href={`/blog?tag=${tag}`} key={tag}>
          #{tag}
        </Text>
      ))}
    </div>
  );
};
