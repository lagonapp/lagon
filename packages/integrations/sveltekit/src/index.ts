import { writeFileSync } from 'node:fs';
import esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Adapter } from '@sveltejs/kit';

const files = fileURLToPath(new URL('../files', import.meta.url).href);

export default function(): Adapter {
  return {
    name: '@lagon/sveltekit',
    async adapt(builder) {
      const out = 'build';
      const tmp = builder.getBuildDirectory('adapter-lagon');

      builder.rimraf(out);
      builder.rimraf(tmp);
      builder.mkdirp(tmp);

      builder.log.minor('Copying assets');
      builder.writeClient(`${out}/client${builder.config.kit.paths.base}`);
      builder.writePrerendered(`${out}/client${builder.config.kit.paths.base}`);

      builder.log.minor('Building server');

      builder.writeServer(tmp);

      writeFileSync(
        `${out}/manifest.js`,
        `export const manifest = ${builder.generateManifest({ relativePath: './' })};`,
      );

      const pth = `${tmp}/index.js`;

      await esbuild.build({
        target: 'es2020',
        platform: 'browser',
        entryPoints: [pth],
        outfile: `${out}/bundle.js`,
        allowOverwrite: true,
        format: 'esm',
        bundle: true,
        minify: true,
      });

      builder.copy(files, out, {
        replace: {
          SERVER: './bundle.js',
          MANIFEST: './manifest.js',
        },
      });

      builder.copy(`${tmp}/nodes`, `${out}/nodes`);
      builder.copy(`${tmp}/entries`, `${out}/entries`);
      builder.copy(`${tmp}/chunks`, `${out}/chunks`);
    },
  };
}
