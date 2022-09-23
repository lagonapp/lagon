(globalThis => {
  // @ts-expect-error we only set `env` field
  globalThis.process = {
    env: {},
  };
})(globalThis);
