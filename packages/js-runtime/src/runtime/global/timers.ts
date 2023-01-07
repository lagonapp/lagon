(globalThis => {
  type Timer = {
    handler: () => void;
    repeat: boolean;
  };

  let counter = 0;
  const timers = new Map<number, Timer>();

  const addTimer = (handler: () => void, timeout = 0, repeat: boolean) => {
    counter++;

    timers.set(counter, {
      handler,
      repeat,
    });

    Lagon.sleep(timeout).then(() => {
      const timer = timers.get(counter);

      if (timer) {
        timer.handler();
        timers.delete(counter);

        if (timer.repeat) {
          addTimer(timer.handler, timeout, repeat);
        }
      }
    });

    return counter;
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
    Lagon.queueMicrotask(callback);
  };
})(globalThis);
