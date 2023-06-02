import * as esbuild from 'esbuild-wasm';
import { Plugin, Loader } from 'esbuild-wasm';
import { useCallback, useEffect, useState } from 'react';

type EsbuildFileSystem = Map<
  string,
  {
    content: string;
  }
>;

const PROJECT_ROOT = '/project/';

const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];

const extname = (path: string): string => {
  const m = /(\.[a-zA-Z0-9]+)$/.exec(path);
  return m ? m[1] : '';
};

const inferLoader = (p: string): Loader => {
  const ext = extname(p);
  if (RESOLVE_EXTENSIONS.includes(ext)) {
    return ext.slice(1) as Loader;
  }
  if (ext === '.mjs' || ext === '.cjs') {
    return 'js';
  }
  return 'text';
};

const resolvePlugin = (files: EsbuildFileSystem): Plugin => {
  return {
    name: 'resolve',
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.path.startsWith(PROJECT_ROOT)) {
          return {
            path: args.path,
          };
        }
      });

      build.onLoad({ filter: /.*/ }, args => {
        if (args.path.startsWith(PROJECT_ROOT)) {
          const name = args.path.replace(PROJECT_ROOT, '');
          const file = files.get(name);
          if (file) {
            return {
              contents: file.content,
              loader: inferLoader(args.path),
            };
          }
        }
      });
    },
  };
};

export enum ESBuildStatus {
  Success,
  Fail,
  Loading,
}

class EsBuildSingleton {
  static isFirst: boolean = true;
  static getIsFirst = () => {
    if (EsBuildSingleton.isFirst) {
      EsBuildSingleton.isFirst = false;
      return true;
    }
    return EsBuildSingleton.isFirst;
  };
}

export const useEsbuild = () => {
  const [esbuildStatus, setEsbuildStatus] = useState(ESBuildStatus.Loading);
  const [isEsbuildLoading, setIsEsbuildLoading] = useState(true);

  // React.StrictMode will cause useEffect to run twice
  const loadEsbuild = useCallback(async () => {
    try {
      if (EsBuildSingleton.getIsFirst()) {
        await esbuild.initialize({
          wasmURL: `/esbuild.wasm`,
        });
      }

      setEsbuildStatus(ESBuildStatus.Success);
    } catch (e) {
      setEsbuildStatus(ESBuildStatus.Fail);
      console.error(e);
    } finally {
      setIsEsbuildLoading(false);
    }
  }, [isEsbuildLoading, esbuildStatus]);

  const build = useCallback(
    (files: EsbuildFileSystem) =>
      esbuild.build({
        entryPoints: [`${PROJECT_ROOT}index.ts`],
        outdir: '/dist',
        format: 'esm',
        write: false,
        bundle: true,
        target: 'esnext',
        platform: 'browser',
        conditions: ['lagon', 'worker'],
        plugins: [resolvePlugin(files)],
      }),
    [isEsbuildLoading, esbuildStatus],
  );

  useEffect(() => {
    loadEsbuild();
  }, []);

  return { isEsbuildLoading, esbuildStatus, build };
};

export default useEsbuild;
