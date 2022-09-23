(globalThis => {
  const format = (...args: any[]): string => {
    let str = '';

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (typeof arg === 'string') {
        str += arg;
      } else {
        str += JSON.stringify(arg);
      }
    }

    return str;
  };

  globalThis.console.log = (...args: any[]) => {
    Lagon.log(`[log] ${format(...args)}`);
  };

  globalThis.console.info = (...args: any[]) => {
    Lagon.log(`[info] ${format(...args)}`);
  };

  globalThis.console.debug = (...args: any[]) => {
    Lagon.log(`[debug] ${format(...args)}`);
  };

  globalThis.console.error = (...args: any[]) => {
    Lagon.log(`[error] ${format(...args)}`);
  };

  globalThis.console.warn = (...args: any[]) => {
    Lagon.log(`[warn] ${format(...args)}`);
  };
})(globalThis);
