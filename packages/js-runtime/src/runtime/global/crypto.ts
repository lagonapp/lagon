const getRandomValues = <
  T extends
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | BigInt64Array
    | BigUint64Array,
>(
  typedArray: T,
) => Lagon.randomValues(typedArray);

const randomUUID = () => Lagon.uuid();

class CryptoSubtle {}

export const crypto = {
  getRandomValues,
  randomUUID,
  subtle: new CryptoSubtle(),
};
