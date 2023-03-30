import Image from 'next/image';
import Link from 'next/link';
import { getArticles } from '../../lib/blog';
import { Tags } from '../../lib/components/Tags';
import { Text } from '../../lib/components/Text';

export default async function Blog() {
  const articles = await getArticles();

  return (
    <section className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-16">
      <Text size="h2" className="text-center">
        Blog
      </Text>
      {articles.map(({ slug, meta }) => (
        <Link key={slug} href={`/blog/${slug}`} className="flex flex-col gap-2">
          <Text size="h3">{meta.title}</Text>
          <Text size="p">{meta.description}</Text>
          <div className="mt-2 flex flex-col justify-between gap-1 md:flex-row">
            <Text className="text-sm">
              {meta.date} by&nbsp;
              <Image
                src={meta.author.avatar}
                width={16}
                height={16}
                alt={`${meta.author.name}'s avatar`}
                className="inline h-4 w-4 rounded-full"
              />
              &nbsp;
              {meta.author.name}
            </Text>
            <Tags tags={meta.tags} />
          </div>
        </Link>
      ))}
    </section>
  );
}

export const metadata = {
  title: 'Blog - Lagon',
};
