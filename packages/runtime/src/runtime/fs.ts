export const fs = {
  readFile: async (path: string): Promise<string> => {
    // @ts-expect-error $0 is not defined
    return $0.apply(undefined, [path], {
      result: { promise: true, copy: true },
      arguments: { copy: true },
    });
  },
};

// @ts-expect-error fs is not defined
global.fs = fs;
