(globalThis => {
  const inspect = (input: unknown): string => {
    if (typeof input === 'string') {
      return input;
    } else if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input);
    } else if (typeof input === 'function') {
      return '[Function]';
    } else if (input === undefined || input === null) {
      return input === undefined ? 'undefined' : 'null';
    } else {
      const result = JSON.stringify(input);

      if (result === '{}' && typeof input === 'object' && 'toString' in input) {
        return input.toString();
      }

      return result;
    }
  };

  const format = (input: unknown, ...args: unknown[]): string => {
    const result: string[] = [];

    if (typeof input !== 'string') {
      result.push(inspect(input));

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        result.push(inspect(arg));
      }
    } else {
      let i = 0;

      result.push(
        input.replace(/%[sdifjoOc%]/g, match => {
          const arg = args[i++];

          if (!arg) {
            return match;
          }

          switch (match) {
            case '%s':
              return String(arg);
            case '%d':
              return String(Number(arg));
            case '%i':
              return String(parseInt(arg as string, 10));
            case '%f':
              return String(parseFloat(arg as string));
            case '%j':
            case '%o':
            case '%O':
              return JSON.stringify(arg);
            case '%%':
              return '%';
            case '%c':
            default:
              return match;
          }
        }),
      );

      for (let j = i; j < args.length; j++) {
        const arg = args[j];

        result.push(inspect(arg));
      }
    }

    return result.join(' ');
  };

  const types = ['log', 'info', 'debug', 'error', 'warn'] as const;

  types.forEach(type => {
    globalThis.console[type] = (input, ...args) => {
      LagonSync.log(type, format(input, ...args));
    };
  });
})(globalThis);
