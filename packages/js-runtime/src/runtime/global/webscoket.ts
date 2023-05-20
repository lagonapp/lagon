(globalThis => {
  enum WsState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
  }

  enum EventType {
    CLOSING = '__RUNTIME_WS_EVENT_CLOSING__',
    PING = '__RUNTIME_WS_EVENT_PING__',
    PONG = '__RUNTIME_WS_EVENT_PONG__',
    CLOSED = '__RUNTIME_WS_EVENT_CLOSED__',
  }

  // @ts-expect-error
  globalThis.WebSocket = class extends EventTarget {
    private _url: string;
    get url() {
      return this._url;
    }
    private wsId: string = '';
    private _protocols: string = '';
    get protocols() {
      return this._protocols;
    }
    private _extensions: string = '';
    get extensions() {
      return this._extensions;
    }
    private _readyState: WsState = WsState.CONNECTING;
    get readyState() {
      return this._readyState;
    }
    private _binaryType = 'blob';
    get binaryType() {
      return this._binaryType;
    }
    private idleTimeoutTimeout: NodeJS.Timeout | undefined;
    private idleTimeoutDuration: number | undefined;
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;
    constructor(url: string | URL, protocols: string | string[] | undefined = []) {
      super();
      let wsURL: URL;
      if (url instanceof URL) {
        wsURL = url;
      } else {
        try {
          wsURL = new URL(url);
        } catch (e) {
          throw e;
        }
      }

      if (wsURL.protocol !== 'ws:' && wsURL.protocol !== 'wss:') {
        throw new DOMException('Only ws & wss schemes are allowed in a WebSocket URL.', 'SyntaxError');
      }

      if (wsURL.hash !== '' || wsURL.href.endsWith('#')) {
        throw new DOMException('Fragments are not allowed in a WebSocket URL.', 'SyntaxError');
      }

      this._url = wsURL.href;

      let __protocols: string[];

      if (typeof protocols === 'string') {
        __protocols = [protocols];
      } else {
        __protocols = protocols;
      }

      if (protocols.length !== new Set([...__protocols.map(item => item.toLocaleLowerCase())]).size) {
        throw new DOMException("Can't supply multiple times the same protocol.", 'SyntaxError');
      }

      LagonAsync.createWebsocket(wsURL.href, __protocols.join(', '))
        .then(({ wsId, protocols, extensions }) => {
          this.wsId = wsId;
          this._protocols = protocols;
          this._extensions = extensions;

          if (this._readyState === WsState.CLOSING) {
            LagonAsync.websocketClose(this.wsId).then(() => {
              this._readyState = WsState.CLOSED;
              const errEvent = new Event('error');
              this.dispatchEvent(errEvent);
              const event = new Event('close');
              this.dispatchEvent(event);
            });
          } else {
            this._readyState = WsState.OPEN;
            const event = new Event('open');
            this.dispatchEvent(event);

            this.eventLoop();
          }
        })
        .catch(err => {
          this._readyState = WsState.CLOSED;

          const errorEv = new Event('error', { error: err, message: err.toString() });
          this.dispatchEvent(errorEv);

          const closeEv = new Event('close');
          this.dispatchEvent(closeEv);
        });
    }

    send(data: string | ArrayBuffer) {
      if (this._readyState !== WsState.OPEN) {
        throw new DOMException('readyState not OPEN', 'InvalidStateError');
      }

      LagonAsync.websocketSend(this.wsId, data);
    }

    close(code?: number, reason?: string) {
      if (this._readyState === WsState.CONNECTING) {
        this._readyState = WsState.CLOSING;
      } else if (this._readyState === WsState.OPEN) {
        this._readyState = WsState.CLOSING;

        LagonAsync.websocketClose(this.wsId, code, reason).catch(err => {
          const errorEv = new Event('error', {
            error: err,
            message: err.toString(),
          });
          this.dispatchEvent(errorEv);

          const closeEv = new Event('close');
          this.dispatchEvent(closeEv);
        });
      }
    }

    private async eventLoop() {
      while (this._readyState !== WsState.CLOSED) {
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
              const prevState = this._readyState;
              this._readyState = WsState.CLOSED;
              clearTimeout(this.idleTimeoutTimeout);

              if (prevState === WsState.OPEN) {
                try {
                  await LagonAsync.websocketClose(this.wsId);
                } catch {
                  // ignore failures
                }
              }

              const event = new Event('close', {
                wasClean: true,
              });
              this.dispatchEvent(event);
              break;
            }
            default:
              this.serverHandleIdleTimeout();
              const event = new Event('message', {
                data,
                origin: this._url,
              });
              this.dispatchEvent(event);
          }
        } catch (e: any) {
          this._readyState = WsState.CLOSED;
          const errorEv = new Event('error', {
            message: e,
          });
          this.dispatchEvent(errorEv);
          const closeEv = new Event('close');
          this.dispatchEvent(closeEv);
          LagonAsync.websocketClose(this.wsId, 4, e.toString());
          throw e;
        }
      }
    }

    private serverHandleIdleTimeout() {
      if (this.idleTimeoutDuration) {
        clearTimeout(this.idleTimeoutTimeout);

        this.idleTimeoutTimeout = setTimeout(async () => {
          if (this._readyState === WsState.OPEN) {
            await LagonAsync.websocketSend(this.wsId, '__RUNTIME_PING__');
            this.idleTimeoutTimeout = setTimeout(async () => {
              if (this._readyState === WsState.OPEN) {
                this._readyState = WsState.CLOSING;
                const reason = 'No response from ping frame.';
                await LagonAsync.websocketClose(this.wsId, 1001, reason);
                this._readyState = WsState.CLOSED;

                const errEvent = new Event('error', {
                  message: reason,
                });
                this.dispatchEvent(errEvent);

                const event = new Event('close', {
                  wasClean: false,
                  code: 1001,
                  reason,
                });
                this.dispatchEvent(event);
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
