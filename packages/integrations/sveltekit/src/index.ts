import esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Adapter } from '@sveltejs/kit';
import { writeFileSync } from 'node:fs';
import { posix, dirname } from 'node:path';

export default function (): Adapter {
  return {
    name: '@lagon/sveltekit',
    async adapt(builder) {
      const main = 'build/index.js';
      const bucket = 'build/public';

      const files = fileURLToPath(new URL('../files', import.meta.url).href);
      const tmp = builder.getBuildDirectory('lagon-tmp');

      builder.rimraf(tmp);
      builder.mkdirp(tmp);

      builder.rimraf(bucket);
      builder.rimraf(dirname(main));

      const relativePath = posix.relative(tmp, builder.getServerDirectory());

      builder.copy(`${files}/entry.js`, `${tmp}/entry.js`, {
        replace: {
          SERVER: `${relativePath}/index.js`,
          MANIFEST: './manifest.js',
        },
      });

      writeFileSync(
        `${tmp}/manifest.js`,
        `export const manifest = ${builder.generateManifest({
          relativePath,
        })};\n\nexport const prerendered = new Map(${JSON.stringify(
          Array.from(builder.prerendered.pages.entries()),
        )});\n`,
      );

      await esbuild.build({
        target: 'es2022',
        conditions: ['worker', 'browser'],
        platform: 'browser',
        entryPoints: [`${tmp}/entry.js`],
        outfile: main,
        allowOverwrite: true,
        format: 'esm',
        bundle: true,
        minify: true,
      });

      const bucket_dir = `${bucket}${builder.config.kit.paths.base}`;
      builder.writeClient(bucket_dir);
      builder.writePrerendered(bucket_dir);
    },
  };
}
