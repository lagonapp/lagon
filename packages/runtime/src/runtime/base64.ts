export function atob(encodedData: string): string {
  // @ts-expect-error $0 is not defined
  return $0.applySync(undefined, [encodedData], {
    result: { copy: true },
    arguments: { copy: true },
  });
}

global.atob = atob;
