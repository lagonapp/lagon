/* eslint-disable @typescript-eslint/no-unused-vars */
(globalThis => {
  const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => Lagon.randomValues(array);
  const randomUUID = () => Lagon.uuid();

  const SYMMETRIC_ALGORITHMS = ['HMAC', 'AES-CBC', 'AES-CTR', 'AES-GCM', 'AES-KW'];

  globalThis.CryptoKey = class {
    readonly algorithm: KeyAlgorithm;
    readonly extractable: boolean;
    readonly type: KeyType;
    readonly usages: KeyUsage[];

    // Trick to make TypeScript happy, CryptoKey constructor is normally empty
    // but we need to construct it at some point.
    constructor(algorithm?: KeyAlgorithm, extractable?: boolean, type?: KeyType, usages?: KeyUsage[]) {
      this.algorithm = algorithm!;
      this.extractable = extractable!;
      this.type = type!;
      this.usages = usages!;
    }
  };

  class CryptoSubtle {
    async decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      throw new Error('Not implemented');
    }

    async deriveBits(
      algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      length: number,
    ): Promise<ArrayBuffer> {
      throw new Error('Not implemented');
    }

    async deriveKey(
      algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      derivedKeyType: AlgorithmIdentifier | AesDerivedKeyParams | HmacImportParams | HkdfParams | Pbkdf2Params,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKey> {
      throw new Error('Not implemented');
    }

    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      throw new Error('Not implemented');
    }

    async encrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      throw new Error('Not implemented');
    }

    async exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>;
    async exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey): Promise<ArrayBuffer>;
    async exportKey(format: KeyFormat, key: CryptoKey): Promise<ArrayBuffer | JsonWebKey> {
      throw new Error('Not implemented');
    }

    async generateKey(
      algorithm: RsaHashedKeyGenParams | EcKeyGenParams,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage>,
    ): Promise<CryptoKeyPair>;
    async generateKey(
      algorithm: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage>,
    ): Promise<CryptoKey>;
    async generateKey(
      algorithm: AlgorithmIdentifier,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKeyPair | CryptoKey> {
      let isSymmetric;

      if (typeof algorithm === 'string') {
        isSymmetric = SYMMETRIC_ALGORITHMS.includes(algorithm);
      } else {
        isSymmetric = SYMMETRIC_ALGORITHMS.includes(algorithm.name);
      }

      if (isSymmetric) {
        return new CryptoKey(algorithm, extractable, 'secret', keyUsages);
      } else {
        return {
          privateKey: new CryptoKey(algorithm, extractable, 'private', keyUsages),
          publicKey: new CryptoKey(algorithm, extractable, 'public', keyUsages),
        };
      }
    }

    async importKey(
      format: 'jwk',
      keyData: JsonWebKey,
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage>,
    ): Promise<CryptoKey>;
    async importKey(
      format: Exclude<KeyFormat, 'jwk'>,
      keyData: BufferSource,
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKey>;
    async importKey(
      format: KeyFormat,
      keyData: JsonWebKey | BufferSource,
      algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage> | Iterable<KeyUsage>,
    ): Promise<CryptoKey> {
      return new CryptoKey(algorithm, extractable, 'secret', keyUsages);
    }

    async sign(
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      return Lagon.sign(algorithm, key, data);
    }

    async unwrapKey(
      format: KeyFormat,
      wrappedKey: BufferSource,
      unwrappingKey: CryptoKey,
      unwrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      unwrappedKeyAlgorithm:
        | AlgorithmIdentifier
        | RsaHashedImportParams
        | EcKeyImportParams
        | HmacImportParams
        | AesKeyAlgorithm,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKey> {
      throw new Error('Not implemented');
    }

    async verify(
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      signature: BufferSource,
      data: BufferSource,
    ): Promise<boolean> {
      return Lagon.verify(algorithm, key, signature, data);
    }

    async wrapKey(
      format: KeyFormat,
      key: CryptoKey,
      wrappingKey: CryptoKey,
      wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
    ): Promise<ArrayBuffer> {
      throw new Error('Not implemented');
    }
  }

  globalThis.crypto = {
    getRandomValues,
    randomUUID,
    subtle: new CryptoSubtle(),
  };
})(globalThis);