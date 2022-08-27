// js/base64.ts
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function atob(encodedData) {
  const str = String(encodedData).replace(/[=]+$/, "");
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  let output = "";
  let bs = 0;
  for (let bc = 0, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}
function btoa(stringToEncode) {
  const str = String(stringToEncode);
  let output = "";
  let block = 0;
  for (let charCode, idx = 0, map = chars; str.charAt(idx | 0) || (map = "=", idx % 1); output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
    charCode = str.charCodeAt(idx += 3 / 4);
    if (charCode > 255) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
}

// js/encoding.ts
var TextEncoder = class {
  encoding = "utf-8";
  encode(string) {
    let pos = 0;
    const len = string.length;
    let at = 0;
    let tlen = Math.max(32, len + (len >> 1) + 7);
    let target = new Uint8Array(tlen >> 3 << 3);
    while (pos < len) {
      let value = string.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319) {
        if (pos < len) {
          const extra = string.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
        if (value >= 55296 && value <= 56319) {
          continue;
        }
      }
      if (at + 4 > target.length) {
        tlen += 8;
        tlen *= 1 + pos / string.length * 2;
        tlen = tlen >> 3 << 3;
        const update = new Uint8Array(tlen);
        update.set(target);
        target = update;
      }
      if ((value & 4294967168) === 0) {
        target[at++] = value;
        continue;
      } else if ((value & 4294965248) === 0) {
        target[at++] = value >> 6 & 31 | 192;
      } else if ((value & 4294901760) === 0) {
        target[at++] = value >> 12 & 15 | 224;
        target[at++] = value >> 6 & 63 | 128;
      } else if ((value & 4292870144) === 0) {
        target[at++] = value >> 18 & 7 | 240;
        target[at++] = value >> 12 & 63 | 128;
        target[at++] = value >> 6 & 63 | 128;
      } else {
        continue;
      }
      target[at++] = value & 63 | 128;
    }
    return target.slice(0, at);
  }
};
var TextDecoder = class {
  encoding = "utf-8";
  decode(buffer) {
    const bytes = new Uint8Array(buffer);
    let pos = 0;
    const len = bytes.length;
    const out = [];
    while (pos < len) {
      const byte1 = bytes[pos++];
      if (byte1 === 0) {
        break;
      }
      if ((byte1 & 128) === 0) {
        out.push(byte1);
      } else if ((byte1 & 224) === 192) {
        const byte2 = bytes[pos++] & 63;
        out.push((byte1 & 31) << 6 | byte2);
      } else if ((byte1 & 240) === 224) {
        const byte2 = bytes[pos++] & 63;
        const byte3 = bytes[pos++] & 63;
        out.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
      } else if ((byte1 & 248) === 240) {
        const byte2 = bytes[pos++] & 63;
        const byte3 = bytes[pos++] & 63;
        const byte4 = bytes[pos++] & 63;
        let codepoint = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
        if (codepoint > 65535) {
          codepoint -= 65536;
          out.push(codepoint >>> 10 & 1023 | 55296);
          codepoint = 56320 | codepoint & 1023;
        }
        out.push(codepoint);
      } else {
      }
    }
    return String.fromCharCode.apply(null, out);
  }
};

// js/fetch.ts
var Headers = class {
  headers = /* @__PURE__ */ new Map();
  constructor(init) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.addValue(key, value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.addValue(key, value);
        });
      }
    }
  }
  addValue(name, value) {
    const values = this.headers.get(name);
    if (values) {
      values.push(value);
    } else {
      this.headers.set(name, [value]);
    }
  }
  append(name, value) {
    this.addValue(name, value);
  }
  delete(name) {
    this.headers.delete(name);
  }
  *entries() {
    for (const [key, values] of this.headers) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }
  get(name) {
    return this.headers.get(name)?.[0];
  }
  has(name) {
    return this.headers.has(name);
  }
  keys() {
    return this.headers.keys();
  }
  set(name, value) {
    this.headers.set(name, [value]);
  }
  *values() {
    for (const [, values] of this.headers) {
      for (const value of values) {
        yield value;
      }
    }
  }
};

// js/parseMultipart.ts
var parseMultipart = (headers, body) => {
  if (!body) {
    return {};
  }
  const contentTypeHeader = headers.get("content-type");
  let boundary;
  const getBoundary = (header) => header?.split(";")?.[1]?.split("=")?.[1];
  if (Array.isArray(contentTypeHeader)) {
    contentTypeHeader.forEach((header) => {
      if (!boundary) {
        boundary = getBoundary(header);
      }
    });
  } else {
    boundary = getBoundary(contentTypeHeader);
  }
  if (!boundary) {
    return {};
  }
  const result = {};
  for (const part of body.split(boundary)) {
    if (part?.includes("Content-Disposition")) {
      const content = part.split('name="')?.[1].split('"\\r\\n\\r\\n');
      if (content) {
        const [name, value] = content;
        result[name] = value.replace("\\r\\n\\r\\n--", "");
      }
    }
  }
  return result;
};

// js/Request.ts
var Request = class {
  method;
  headers;
  body;
  url;
  constructor(input, options) {
    this.method = options?.method || "GET";
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        this.headers = options.headers;
      } else {
        this.headers = new Headers(options.headers);
      }
    } else {
      this.headers = new Headers();
    }
    this.body = options?.body;
    this.url = input;
  }
  async text() {
    return this.body || "";
  }
  async json() {
    return JSON.parse(this.body || "{}");
  }
  async formData() {
    return parseMultipart(this.headers, this.body);
  }
};

// js/Response.ts
var Response = class {
  body;
  headers;
  ok;
  status;
  statusText;
  url;
  constructor(body, options) {
    this.body = body;
    if (options?.headers) {
      if (options.headers instanceof Headers) {
        this.headers = options.headers;
      } else {
        this.headers = new Headers(options.headers);
      }
    } else {
      this.headers = new Headers();
    }
    if (options?.status) {
      this.ok = options.status >= 200 && options.status < 300;
    } else {
      this.ok = true;
    }
    this.status = options?.status || 200;
    this.statusText = options?.statusText || "OK";
    this.url = options?.url || "";
  }
  async text() {
    return this.body;
  }
  async json() {
    return JSON.parse(this.body);
  }
  async formData() {
    return parseMultipart(this.headers, this.body);
  }
};

// js/URL.ts
var URLSearchParams = class {
  params = /* @__PURE__ */ new Map();
  constructor(init) {
    if (init) {
      if (typeof init === "string") {
        init.replace("?", "").split("&").forEach((entry) => {
          const [key, value] = entry.split("=");
          this.addValue(key, value);
        });
      } else if (typeof init === "object") {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.addValue(key, value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.addValue(key, value);
          });
        }
      }
    }
  }
  addValue(name, value) {
    const values = this.params.get(name);
    if (values) {
      values.push(value);
    } else {
      this.params.set(name, [value]);
    }
  }
  append(name, value) {
    this.addValue(name, value);
  }
  delete(name) {
    this.params.delete(name);
  }
  *entries() {
    for (const [key, values] of this.params) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }
  forEach(callback, thisArg) {
    this.params.forEach((values, key) => {
      values.forEach((value) => {
        callback.call(thisArg, value, key, this);
      });
    });
  }
  get(name) {
    return this.params.get(name)?.[0];
  }
  getAll(name) {
    return this.params.get(name);
  }
  has(name) {
    return this.params.has(name);
  }
  keys() {
    return this.params.keys();
  }
  set(name, value) {
    this.params.set(name, [value]);
  }
  sort() {
    this.params = new Map([...this.params].sort());
  }
  toString() {
    return Array.from(this.params.entries()).map(([key, value]) => `${key}=${value}`).join("&");
  }
  *values() {
    for (const [, values] of this.params) {
      for (const value of values) {
        yield value;
      }
    }
  }
};
var URL = class {
  hash = "";
  host = "";
  hostname = "";
  href = "";
  origin = "";
  password = "";
  pathname = "";
  port = "";
  protocol = "";
  search = "";
  searchParams = null;
  username = "";
  constructor(url, base) {
    let finalUrl = url;
    if (base) {
      const baseUrl = new URL(base);
      finalUrl = baseUrl.protocol + "//" + baseUrl.host;
      if (!url.startsWith("/")) {
        finalUrl += "/";
      }
      finalUrl += url;
    }
    const result = /((?:blob|file):)?(https?\:)\/\/(?:(.*):(.*)@)?(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/.exec(finalUrl);
    if (result) {
      const [href, origin, protocol, username, password, host, hostname, port, pathname, search, hash] = result;
      this.hash = hash;
      this.host = host;
      this.hostname = hostname;
      this.href = href;
      if (["http:", "https:"].includes(protocol) || ["blob:", "file:"].includes(origin)) {
        this.origin = protocol + "//" + hostname;
      }
      this.password = password;
      this.pathname = pathname === "" ? "/" : pathname;
      this.port = port;
      this.protocol = protocol;
      this.search = search;
      this.searchParams = new URLSearchParams(search);
      this.username = username;
    }
  }
  toString() {
    return this.href;
  }
};

// js/console.ts
((globalThis2) => {
  const format = (...args) => {
    let str = "";
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === "string") {
        str += arg;
      } else {
        str += JSON.stringify(arg);
      }
    }
    return str;
  };
  globalThis2.console.log = (...args) => {
    Lagon.log(`[log] ${format(...args)}`);
  };
  globalThis2.console.info = (...args) => {
    Lagon.log(`[info] ${format(...args)}`);
  };
  globalThis2.console.debug = (...args) => {
    Lagon.log(`[debug] ${format(...args)}`);
  };
  globalThis2.console.error = (...args) => {
    Lagon.log(`[error] ${format(...args)}`);
  };
  globalThis2.console.warn = (...args) => {
    Lagon.log(`[warn] ${format(...args)}`);
  };
})(globalThis);
export {
  Headers,
  Request,
  Response,
  TextDecoder,
  TextEncoder,
  URL,
  URLSearchParams,
  atob,
  btoa,
  parseMultipart
};
