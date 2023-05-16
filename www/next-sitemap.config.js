/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://lagon.app',
  outDir: 'out',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  transform: (config, path) => {
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 1,
      };
    }

    if (path === '/pricing') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
      };
    }

    if (path.startsWith('/blog')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
      };
    }

    return {
      loc: path,
      priority: config.priority,
    };
  },
};
