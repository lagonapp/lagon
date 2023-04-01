import fs from 'node:fs/promises';
import path from 'node:path';

const ARTICLES_DIR = path.join(process.cwd(), 'app/blog');

export type Author = {
  name: string;
  avatar: string;
  bio: string;
  handle: string;
};

export type Article = {
  slug: string;
  meta: {
    title: string;
    date: string;
    description: string;
    author: Author;
    tags: string[];
  };
};

export const getArticles = async (): Promise<Article[]> => {
  const files = await fs.readdir(ARTICLES_DIR);

  return Promise.all(
    files
      .filter(file => !file.endsWith('.mdx') && !file.endsWith('.tsx'))
      .map(async directory => {
        const content = await import(`../app/blog/${directory}/page.mdx`);

        return {
          slug: directory,
          meta: content.meta,
        };
      }),
  );
};
