(globalThis => {
  // Inspired by https://gitlab.istic.univ-rennes1.fr/16004760/genie-logiciel-iot/-/blob/a682f438b34eaa9e80655c321e31cf78c7538879/Raspberry-Pi/node_modules/fast-text-encoding/text.js
  globalThis.TextEncoder = class {
    readonly encoding = 'utf-8';

    encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult {
      // TODO
      throw new Error('Not implemented');
    }

    encode(input = ''): Uint8Array {
      let pos = 0;
      const len = input.length;

      let at = 0; // output position
      let tlen = Math.max(32, len + (len >> 1) + 7); // 1.5x size
      let target = new Uint8Array((tlen >> 3) << 3); // ... but at 8 byte offset

      while (pos < len) {
        let value = input.charCodeAt(pos++);
        if (value >= 0xd800 && value <= 0xdbff) {
          // high surrogate
          if (pos < len) {
            const extra = input.charCodeAt(pos);
            if ((extra & 0xfc00) === 0xdc00) {
              ++pos;
              value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
            }
          }
          if (value >= 0xd800 && value <= 0xdbff) {
            continue; // drop lone surrogate
          }
        }

        // expand the buffer if we couldn't write 4 bytes
        if (at + 4 > target.length) {
          tlen += 8; // minimum extra
          tlen *= 1.0 + (pos / input.length) * 2; // take 2x the remaining
          tlen = (tlen >> 3) << 3; // 8 byte offset

          const update = new Uint8Array(tlen);
          update.set(target);
          target = update;
        }

        if ((value & 0xffffff80) === 0) {
          // 1-byte
          target[at++] = value; // ASCII
          continue;
        } else if ((value & 0xfffff800) === 0) {
          // 2-byte
          target[at++] = ((value >> 6) & 0x1f) | 0xc0;
        } else if ((value & 0xffff0000) === 0) {
          // 3-byte
          target[at++] = ((value >> 12) & 0x0f) | 0xe0;
          target[at++] = ((value >> 6) & 0x3f) | 0x80;
        } else if ((value & 0xffe00000) === 0) {
          // 4-byte
          target[at++] = ((value >> 18) & 0x07) | 0xf0;
          target[at++] = ((value >> 12) & 0x3f) | 0x80;
          target[at++] = ((value >> 6) & 0x3f) | 0x80;
        } else {
          // FIXME: do we care
          continue;
        }

        target[at++] = (value & 0x3f) | 0x80;
      }

      return target.slice(0, at);
    }
  };
})(globalThis);
