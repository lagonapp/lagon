(globalThis => {
  type Timer = {
    handler: () => void;
    repeat: boolean;
  };

  let counter = 0;
  const timers = new Map<number, Timer>();

  const addTimer = (handler: () => void, timeout = 0, repeat: boolean) => {
    const id = counter++;

    timers.set(id, {
      handler: AsyncContext.wrap(handler),
      repeat,
    });

    LagonAsync.sleep(timeout).then(() => {
      const timer = timers.get(id);

      if (timer) {
        timer.handler();
        timers.delete(id);

        if (timer.repeat) {
          addTimer(timer.handler, timeout, repeat);
        }
      }
    });

    return id;
  };

  // @ts-expect-error missing __promisify__
  globalThis.setTimeout = (handler, timeout) => addTimer(handler, timeout, false);

  globalThis.clearTimeout = id => {
    timers.delete(id as number);
  };

  // @ts-expect-error missing __promisify__
  globalThis.setInterval = (handler, timeout) => addTimer(handler, timeout, true);

  globalThis.clearInterval = id => {
    timers.delete(id as number);
  };

  globalThis.queueMicrotask = callback => {
    LagonSync.queueMicrotask(AsyncContext.wrap(callback));
  };
})(globalThis);
