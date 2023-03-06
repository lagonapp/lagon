import { GetStaticProps } from 'next';
import Link from 'next/link';
import { Article, getArticles } from '../../lib/blog';
import { Text } from '../../lib/components/Text';
import Image from 'next/image';
import { Tags } from '../../lib/components/Tags';
import Head from 'next/head';

type BlogProps = {
  articles: Article[];
};

const Blog = ({ articles }: BlogProps) => {
  return (
    <section className="z-10 mx-auto flex w-full max-w-2xl flex-col gap-16">
      <Head>
        <title>Blog - Lagon</title>
      </Head>
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
};

export const getStaticProps: GetStaticProps<BlogProps> = async () => {
  return {
    props: {
      articles: await getArticles(),
    },
  };
};

export default Blog;
