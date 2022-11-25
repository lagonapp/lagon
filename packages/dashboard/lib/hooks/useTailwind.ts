import { useMemo } from 'react';

const useTailwind = <T extends Record<string, string | number | boolean | undefined>>(
  props: T,
  // @ts-expect-error to fix
  object: { [key in keyof T]: T[key] extends boolean ? string : { [prop in T[key]]: string } },
): string => {
  return useMemo(() => {
    const classes = [];

    for (const key in props) {
      // @ts-expect-error to fix
      classes.push(typeof props[key] === 'boolean' && props[key] === true ? object[key] : object[key][props[key]]);
    }

    return classes.join(' ');
  }, [props, object]);
};

export default useTailwind;
