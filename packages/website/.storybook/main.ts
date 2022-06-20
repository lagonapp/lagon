import postcss from 'postcss';
import * as tailwindcss from '../tailwind.config';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'

module.exports = {
  stories: [
    "../lib/**/*.stories.mdx",
    "../lib/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: postcss,
          postcssOptions: {
            plugins: {
              tailwindcss,
              autoprefixer: {
              },
            },
          },
        },
      },
    },
  ],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-webpack5"
  },
  webpackFinal: async (config) => {
    config.resolve['plugins'] = [
      new TsconfigPathsPlugin({ extensions: config.resolve.extensions })
    ]

    return config;
  }
}