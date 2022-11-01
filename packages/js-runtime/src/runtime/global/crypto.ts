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

type EncryptDecryptoAlgorithm =
  | {
      name: 'RSA-OAEP';
      label?: ArrayBuffer;
    }
  | {
      name: 'AES-CBC' | 'AES-CGM';
      iv: ArrayBuffer;
    }
  | {
      name: 'AES-CTR';
      counter: ArrayBuffer;
      length: number;
    };

type GenAlgorithm =
  | {
      name: 'HMAC';
      hash: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
      length?: number;
    }
  | {
      name: 'ECDSA' | 'ECDH';
      namedCurve: 'P-256' | 'P-384' | 'P-521';
    }
  | {
      name: 'RSASSA-PKCS1-v1_5' | 'RSA-PSS' | 'RSA-OAEP';
      modulusLength: number;
      publicExponent: Uint8Array;
      hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
    }
  | {
      name: 'AES-CBC' | 'AES-CTR' | 'AES-GCM' | 'AES-KW';
      length: number;
    };

type SignVerifyAlgorithm =
  | 'RSASSA-PKCS1-v1_5'
  | {
      name: 'RSASSA-PKCS1-v1_5';
    }
  | {
      name: 'RSA-PSS';
      saltLength: number;
    }
  | {
      name: 'ECDSA';
      hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
    }
  | 'HMAC'
  | {
      name: 'HMAC';
    };

// type ImportAlgorithm =
//   | {
//       name: 'RSASSA-PKCS1-v1_5' | 'RSA-PSS' | 'RSA-OAEP';
//       hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
//     }
//   | {
//       name: 'ECDSA' | 'ECDH';
//       namedCurve: 'P-256' | 'P-384' | 'P-521';
//     }
//   | {
//       name: 'HMAC';
//       hash: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
//       length?: number;
//     }
//   | 'AES-CTR'
//   | 'AES-CBC'
//   | 'AES-GCM'
//   | 'AES-KW'
//   | {
//       name: 'AES-CTR' | 'AES-CBC' | 'AES-GCM' | 'AES-KW';
//     }
//   | 'PBKDF2'
//   | 'HKDF';

type AlgorithmName = GenAlgorithm['name'];

type KeyUsage = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'deriveKey' | 'deriveBits' | 'wrapKey' | 'unwrapKey';
type CryptoKeyType = 'secret' | 'private' | 'public';
type ImportFormat = 'raw' | 'pkcs8' | 'spki' | 'jwk';

const SYMMETRIC_ALGORITHMS: AlgorithmName[] = ['HMAC', 'AES-CBC', 'AES-CTR', 'AES-GCM', 'AES-KW'];

class CryptoKey {
  type: CryptoKeyType;
  extractable: boolean;
  algorithm: GenAlgorithm;
  usages: KeyUsage[];

  constructor(type: CryptoKeyType, extractable: boolean, algorithm: GenAlgorithm, usages: KeyUsage[]) {
    this.type = type;
    this.extractable = extractable;
    this.algorithm = algorithm;
    this.usages = usages;
  }
}

class CryptoKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;

  constructor(privateKey: CryptoKey, publicKey: CryptoKey) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }
}

class CryptoSubtle {
  async encrypt(algorithm: EncryptDecryptoAlgorithm, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
    return data;
  }

  async decrypt(algorithm: EncryptDecryptoAlgorithm, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
    return data;
  }

  async sign(algorithm: SignVerifyAlgorithm, key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
    return Lagon.sign(algorithm, key, data);
  }

  async verify(
    algorithm: SignVerifyAlgorithm,
    key: CryptoKey,
    signature: ArrayBuffer,
    data: ArrayBuffer,
  ): Promise<boolean> {
    return Lagon.verify(algorithm, key, signature, data);
  }

  async digest(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', data: ArrayBuffer): Promise<ArrayBuffer> {
    return data;
  }

  async generateKey(
    algorithm: GenAlgorithm,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey | CryptoKeyPair> {
    if (SYMMETRIC_ALGORITHMS.includes(algorithm.name)) {
      return new CryptoKey('secret', extractable, algorithm, keyUsages);
    } else {
      return new CryptoKeyPair(
        new CryptoKey('private', extractable, algorithm, keyUsages),
        new CryptoKey('public', extractable, algorithm, keyUsages),
      );
    }
  }

  async importKey(
    format: ImportFormat,
    keyData: ArrayBuffer,
    algorithm: GenAlgorithm,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey> {
    return new CryptoKey('secret', extractable, algorithm, keyUsages);
  }
}

export const crypto = {
  getRandomValues,
  randomUUID,
  subtle: new CryptoSubtle(),
};
