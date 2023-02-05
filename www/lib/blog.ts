import fs from 'node:fs/promises';
import path from 'node:path';

const ARTICLES_DIR = path.join(process.cwd(), 'pages/blog');

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
      .filter(file => file !== 'index.tsx')
      .map(async file => {
        const slug = file.replace('.mdx', '');
        const content = await import(`../pages/blog/${file}`);

        return {
          slug,
          meta: content.meta,
        };
      }),
  );
};
