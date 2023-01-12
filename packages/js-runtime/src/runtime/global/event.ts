(globalThis => {
  type Listener = {
    callback: EventListenerOrEventListenerObject | null;
    options?: AddEventListenerOptions | boolean;
  };

  globalThis.EventTarget = class {
    private listeners: Map<string, Listener[]> = new Map();

    addEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ) {
      if (typeof options === 'object' && options?.signal === null) {
        throw new TypeError('signal is null');
      }

      const listeners = this.listeners.get(type) ?? [];
      const exists = listeners.find(current => current.callback === callback);

      if (!exists) {
        this.listeners.set(
          type,
          listeners.concat({
            callback,
            options,
          }),
        );
      }
    }

    dispatchEvent(event: Event): boolean {
      const { type, cancelable } = event;

      for (const { callback, options } of this.listeners.get(type) ?? []) {
        const initialPreventDefault = event.preventDefault;
        const passive = typeof options === 'object' && !!options.passive;

        if (passive) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          event.preventDefault = () => {};
        }

        if (typeof options === 'object' && (options.once || options.signal?.aborted)) {
          this.removeEventListener(type, callback, options);

          if (options.signal?.aborted) {
            continue;
          }
        }

        if (typeof callback === 'function') {
          callback(event);
        } else {
          callback?.handleEvent(event);
        }

        if (passive) {
          event.preventDefault = initialPreventDefault;
        }

        if (cancelable && event.defaultPrevented && !passive) {
          return false;
        }
      }

      return true;
    }

    removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: EventListenerOptions | boolean,
    ) {
      const listeners = this.listeners.get(type) ?? [];
      this.listeners.set(
        type,
        listeners.filter(listener => listener.callback !== callback && listener.options !== options),
      );
    }
  };

  // TODO: remove this @ts-ignore, not sure why it complains about
  // NONE, CAPTURING_PHASE, AT_TARGET, BUBBLING_PHASE
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.Event = class {
    readonly bubbles: boolean;
    cancelBubble: boolean;
    readonly cancelable: boolean;
    readonly composed: boolean;
    readonly currentTarget: EventTarget | null;
    readonly defaultPrevented: boolean;
    readonly eventPhase: number;
    readonly isTrusted: boolean;
    returnValue: boolean;
    readonly srcElement: EventTarget | null;
    readonly target: EventTarget | null;
    readonly timeStamp: DOMHighResTimeStamp;
    readonly type: string;

    // https://dom.spec.whatwg.org/#dom-event-eventphase
    static readonly NONE = 0;
    static readonly CAPTURING_PHASE = 1;
    static readonly AT_TARGET: 2;
    static readonly BUBBLING_PHASE = 3;

    constructor(type: string, eventInitDict?: EventInit) {
      if (type === undefined) {
        throw new TypeError('Event requires at least one argument');
      }

      this.type = type;
      this.bubbles = eventInitDict?.bubbles ?? false;
      this.cancelable = eventInitDict?.cancelable ?? false;
      this.composed = eventInitDict?.composed ?? false;

      this.cancelBubble = false;
      this.currentTarget = null;
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.returnValue = true;
      this.srcElement = null;
      this.target = null;
      this.timeStamp = Date.now();
    }

    composedPath(): EventTarget[] {
      return [];
    }

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean) {
      // @ts-expect-error we assign to a readonly property
      this.type = type;
      // @ts-expect-error we assign to a readonly property
      this.bubbles = bubbles ?? false;
      // @ts-expect-error we assign to a readonly property
      this.cancelable = cancelable ?? false;
    }

    preventDefault() {
      // @ts-expect-error we assign to a readonly property
      this.defaultPrevented = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    stopImmediatePropagation() {}

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    stopPropagation() {}
  };

  globalThis.CustomEvent = class<T> extends Event {
    readonly detail: T;

    constructor(type: string, eventInitDict?: CustomEventInit<T>) {
      super(type, eventInitDict);

      this.detail = eventInitDict?.detail ?? (null as T);
    }

    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: T) {
      this.initEvent(type, bubbles, cancelable);
      // @ts-expect-error we assign to a readonly property
      this.detail = detail ?? (null as T);
    }
  };

  globalThis.ProgressEvent = class<T extends EventTarget = EventTarget> extends Event {
    readonly lengthComputable: boolean;
    readonly loaded: number;
    readonly target: T | null = null;
    readonly total: number;

    constructor(type: string, eventInitDict?: ProgressEventInit) {
      super(type, eventInitDict);

      this.lengthComputable = eventInitDict?.lengthComputable ?? false;
      this.loaded = eventInitDict?.loaded ?? 0;
      this.total = eventInitDict?.total ?? 0;
    }
  };
})(globalThis);
