(globalThis => {
  const format = (...args: unknown[]): string => {
    let str = '';

    for (let i = 0; i < args.length; i++) {
      str += ' ';

      const arg = args[i];

      if (typeof arg === 'string') {
        str += arg;
      } else {
        str += JSON.stringify(arg);
      }
    }

    return str;
  };

  const types = ['log', 'info', 'debug', 'error', 'warn'] as const;

  types.forEach(type => {
    globalThis.console[type] = (...args: unknown[]) => {
      Lagon.log(`[${type}]${format(...args)}`);
    };
  });
})(globalThis);
