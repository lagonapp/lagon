(globalThis => {
  enum EventType {
    CLOSING = '__RUNTIME_WS_EVENT_CLOSING__',
    PING = '__RUNTIME_WS_EVENT_PING__',
    PONG = '__RUNTIME_WS_EVENT_PONG__',
    CLOSED = '__RUNTIME_WS_EVENT_CLOSED__',
  }

  const READY_STATE = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  };

  const ALLOWED_PROTOCOLS = ['ws:', 'wss:'];

  globalThis.CloseEvent = class extends Event {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;

    constructor(type: string, eventInitDict?: CloseEventInit) {
      super(type, eventInitDict);

      this.code = eventInitDict?.code ?? 0;
      this.reason = eventInitDict?.reason ?? '';
      this.wasClean = eventInitDict?.wasClean ?? false;
    }
  };

  globalThis.MessageEvent = class<T> extends Event {
    readonly data: T;
    readonly origin: string;
    readonly lastEventId: string;
    readonly source: MessagePort | ServiceWorker | null;
    readonly ports: ReadonlyArray<MessagePort>;

    constructor(type: string, eventInitDict?: MessageEventInit<T>) {
      super(type, eventInitDict);

      this.data = eventInitDict?.data ?? (null as T);
      this.origin = eventInitDict?.origin ?? '';
      this.lastEventId = eventInitDict?.lastEventId ?? '';
      this.source = eventInitDict?.source ?? null;
      this.ports = eventInitDict?.ports ?? [];
    }

    initMessageEvent() {
      throw new TypeError('MessageEvent.prototype.initMessageEvent is not implemented');
    }
  };

  // TODO: remove this @ts-ignore, not sure why it complains about
  // CONNECTING, OPEN, CLOSING, CLOSED
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.WebSocket = class extends EventTarget {
    binaryType: BinaryType = 'blob';
    readonly bufferedAmount: number = 0;
    readonly extensions = '';
    readonly protocol: string = '';
    readonly readyState: number = READY_STATE.CONNECTING;
    readonly url: string;

    private wsId = '';
    private idleTimeoutTimeout: NodeJS.Timeout | undefined;
    private idleTimeoutDuration: number | undefined;

    static readonly CONNECTING: 0;
    static readonly OPEN: 1;
    static readonly CLOSING: 2;
    static readonly CLOSED: 3;

    constructor(url: string | URL, protocols: string | string[] = []) {
      super();

      const wsURL = typeof url === 'string' ? new URL(url) : url;

      if (!ALLOWED_PROTOCOLS.includes(wsURL.protocol)) {
        throw new DOMException('Only ws & wss schemes are allowed in a WebSocket URL.', 'SyntaxError');
      }

      if (wsURL.hash !== '' || wsURL.href.endsWith('#')) {
        throw new DOMException('Fragments are not allowed in a WebSocket URL.', 'SyntaxError');
      }

      this.url = wsURL.href;

      const protocol = typeof protocols === 'string' ? protocols : protocols.join(', ');

      LagonAsync.createWebsocket(this.url, protocol)
        .then(({ wsId, protocol, extensions }) => {
          this.wsId = wsId;
          // @ts-expect-error we assign to a readonly property
          this.protocol = protocol;
          // @ts-expect-error we assign to a readonly property
          this.extensions = extensions;

          if (this.readyState === READY_STATE.CLOSING) {
            LagonAsync.websocketClose(this.wsId).then(() => {
              // @ts-expect-error we assign to a readonly property
              this.readyState = READY_STATE.CLOSED;

              const closeEvent = new CloseEvent('close');
              this.dispatchEvent(closeEvent);
            });
          } else {
            // @ts-expect-error we assign to a readonly property
            this.readyState = READY_STATE.OPEN;
            const event = new Event('open');
            this.dispatchEvent(event);

            this.eventLoop();
          }
        })
        .catch(error => {
          // @ts-expect-error we assign to a readonly property
          this.readyState = READY_STATE.CLOSED;

          const closeEvent = new CloseEvent('close', {
            reason: error.toString(),
          });
          this.dispatchEvent(closeEvent);
        });
    }

    set onclose(callback: EventListenerOrEventListenerObject) {
      this.addEventListener('close', callback);
    }

    set onerror(callback: EventListenerOrEventListenerObject) {
      this.addEventListener('error', callback);
    }

    set onmessage(callback: EventListenerOrEventListenerObject) {
      this.addEventListener('message', callback);
    }

    set onopen(callback: EventListenerOrEventListenerObject) {
      this.addEventListener('open', callback);
    }

    send(data: string | ArrayBuffer) {
      if (this.readyState !== READY_STATE.OPEN) {
        throw new DOMException('readyState not OPEN', 'InvalidStateError');
      }

      LagonAsync.websocketSend(this.wsId, data);
    }

    close(code?: number, reason?: string) {
      if (this.readyState === READY_STATE.CONNECTING) {
        // @ts-expect-error we assign to a readonly property
        this.readyState = READY_STATE.CLOSING;
      } else if (this.readyState === READY_STATE.OPEN) {
        // @ts-expect-error we assign to a readonly property
        this.readyState = READY_STATE.CLOSING;

        LagonAsync.websocketClose(this.wsId, code, reason)
          .then(() => {
            const closeEvent = new Event('error');
            this.dispatchEvent(closeEvent);
          })
          .catch(() => {
            const errorEvent = new Event('error');
            this.dispatchEvent(errorEvent);
          });
      }
    }

    private async eventLoop() {
      while (this.readyState !== READY_STATE.CLOSED) {
        try {
          const data = await LagonAsync.websocketEvent(this.wsId);

          switch (data) {
            case EventType.PING:
              LagonAsync.websocketSend(this.wsId, '__RUNTIME_PING__');
              break;
            case EventType.PONG:
              this.serverHandleIdleTimeout();
              break;
            case EventType.CLOSED:
            case EventType.CLOSING: {
              const prevState = this.readyState;
              // @ts-expect-error we assign to a readonly property
              this.readyState = READY_STATE.CLOSED;
              clearTimeout(this.idleTimeoutTimeout);

              if (prevState === READY_STATE.OPEN) {
                try {
                  await LagonAsync.websocketClose(this.wsId);
                } catch {
                  // ignore failures
                }
              }

              const closeEvent = new CloseEvent('close', {
                wasClean: true,
              });
              this.dispatchEvent(closeEvent);
              break;
            }
            default: {
              this.serverHandleIdleTimeout();
              const event = new MessageEvent('message', {
                data,
                origin: this.url,
              });
              this.dispatchEvent(event);
            }
          }
        } catch (error: any) {
          // @ts-expect-error we assign to a readonly property
          this.readyState = READY_STATE.CLOSED;

          const closeEvent = new CloseEvent('close', {
            reason: error.toString(),
          });
          this.dispatchEvent(closeEvent);

          LagonAsync.websocketClose(this.wsId, 4, error.toString());
          break;
        }
      }
    }

    private serverHandleIdleTimeout() {
      if (this.idleTimeoutDuration) {
        clearTimeout(this.idleTimeoutTimeout);

        this.idleTimeoutTimeout = setTimeout(async () => {
          if (this.readyState === READY_STATE.OPEN) {
            await LagonAsync.websocketSend(this.wsId, '__RUNTIME_PING__');

            this.idleTimeoutTimeout = setTimeout(async () => {
              if (this.readyState === READY_STATE.OPEN) {
                // @ts-expect-error we assign to a readonly property
                this.readyState = READY_STATE.CLOSING;
                const reason = 'No response from ping frame.';
                await LagonAsync.websocketClose(this.wsId, 1001, reason);
                // @ts-expect-error we assign to a readonly property
                this.readyState = READY_STATE.CLOSED;

                const errEvent = new Event('error', {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  message: reason,
                });
                this.dispatchEvent(errEvent);

                const closeEvent = new CloseEvent('close', {
                  code: 1001,
                  reason,
                });
                this.dispatchEvent(closeEvent);
              } else {
                clearTimeout(this.idleTimeoutTimeout);
              }
            }, (this.idleTimeoutDuration! / 2) * 1000);
          } else {
            clearTimeout(this.idleTimeoutTimeout);
          }
        }, (this.idleTimeoutDuration / 2) * 1000);
      }
    }
  };
})(globalThis);
