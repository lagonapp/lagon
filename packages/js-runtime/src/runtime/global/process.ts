(globalThis => {
  globalThis.process = {
    // Spread the process object to make TS happy (even if it doesn't exists yet)
    ...globalThis.process,
    env: {},
    argv: [],
  };
})(globalThis);
