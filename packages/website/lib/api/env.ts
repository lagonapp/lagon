export function envStringToObject(env: string[]): Record<string, string> {
  return env.reduce((acc, current) => {
    const [key, value] = current.split('=');

    if (key && value) {
      return {
        ...acc,
        [key]: value,
      };
    }

    return acc;
  }, {});
}
