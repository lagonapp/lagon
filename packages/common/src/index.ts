export function envStringToObject(env: { key: string; value: string }[]): Record<string, string> {
  return env.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});
}
