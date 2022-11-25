/**
 * Example:
 *
 * NEXT_PUBLIC_LAGON_ROOT_SCHEM=https
 * NEXT_PUBLIC_LAGON_ROOT_DOMAIN=lagon.app
 * name=hello-world
 *
 * -> https://hello-world.lagon.app
 */

export function getFullCurrentDomain({ name }: { name: string }): string {
  return `${process.env.NEXT_PUBLIC_LAGON_ROOT_SCHEM}://${getCurrentDomain({ name })}`;
}

export function getCurrentDomain({ name }: { name: string }): string {
  return `${name}.${process.env.NEXT_PUBLIC_LAGON_ROOT_DOMAIN}`;
}

export function getFullDomain(domain: string): string {
  return `${process.env.NEXT_PUBLIC_LAGON_ROOT_SCHEM}://${domain}`;
}

export function reloadSession() {
  const event = new Event('visibilitychange');
  document.dispatchEvent(event);
}

export function envStringToObject(env: { key: string; value: string }[]): Record<string, string> {
  return env.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});
}
