interface CryptoKey {
  readonly keyValue: ArrayBuffer;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
(globalThis => {
  const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    LagonSync.randomValues(array);
    return array;
  };

  const randomUUID = () => LagonSync.uuid();

  const SYMMETRIC_ALGORITHMS = ['HMAC', 'AES-CBC', 'AES-CTR', 'AES-GCM', 'AES-KW'];

  const checkDeriveAlgorithmType = (algorithm: EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params) => {
    if (typeof algorithm !== 'object') {
      throw TypeError('Algorithm must be EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params');
    }
    algorithm.name = algorithm.name?.toUpperCase();
    switch (algorithm.name) {
      case 'ECDH':
        if (!(algorithm as EcdhKeyDeriveParams).public) {
          throw new TypeError('EcdhKeyDeriveParams must have public');
        }
        break;
      case 'HKDF':
        if (!(algorithm as HkdfParams).hash) {
          throw new TypeError('HkdfParams must have hash');
        }
        if (!(algorithm as HkdfParams).info) {
          throw new TypeError('HkdfParams must have info');
        }
        if (!(algorithm as HkdfParams).salt) {
          throw new TypeError('HkdfParams must have salt');
        }
        break;
      case 'PBKDF2':
        if (!(algorithm as Pbkdf2Params).hash) {
          throw new TypeError('Pbkdf2Params must have hash');
        }
        if (typeof (algorithm as Pbkdf2Params).iterations !== 'number') {
          throw new TypeError('Pbkdf2Params.iterations must be number');
        }
        if (!(algorithm as Pbkdf2Params).salt) {
          throw new TypeError('Pbkdf2Params must have salt');
        }
        break;
      default:
        throw new TypeError('Unrecognized algorithm name');
    }
  };

  const checkDeriveKeyType = (derivedKeyType: AesDerivedKeyParams | HmacImportParams) => {
    if (typeof derivedKeyType !== 'object') {
      throw TypeError('DerivedKeyType must is AesDerivedKeyParams | HmacImportParams');
    }
    derivedKeyType.name = derivedKeyType.name?.toUpperCase();
    switch (derivedKeyType.name) {
      case 'AES-CBC':
      case 'AES-CTR':
      case 'AES-GCM':
      case 'AES-KW':
        if (!(derivedKeyType as AesDerivedKeyParams).length) {
          throw new TypeError('Pbkdf2Params must have length');
        }
        break;
      case 'HMAC':
        if (!(derivedKeyType as HmacImportParams).hash) {
          throw new TypeError('HmacImportParams must have hash');
        }
        break;
      default:
        throw new TypeError('Unrecognized derivedKeyType name');
    }
  };

  const getDeriveKeyLength = (derivedKeyType: AesDerivedKeyParams | HmacImportParams) => {
    switch (derivedKeyType.name) {
      case 'AES-CBC':
      case 'AES-CTR':
      case 'AES-GCM':
      case 'AES-KW': {
        if (![128, 192, 256].includes((derivedKeyType as AesDerivedKeyParams).length)) {
          throw new TypeError('length must be 128, 192, or 256');
        }
        return (derivedKeyType as AesDerivedKeyParams).length;
      }
      case 'HMAC': {
        let length;
        if (derivedKeyType.length === undefined) {
          const keyType: HmacImportParams & { hash: Algorithm } = {
            ...(derivedKeyType as HmacImportParams),
            hash:
              typeof (derivedKeyType as HmacImportParams).hash === 'string'
                ? { name: (derivedKeyType as HmacImportParams).hash as string }
                : ((derivedKeyType as HmacImportParams).hash as Algorithm),
          };
          switch (keyType.hash.name) {
            case 'SHA-1':
              length = 160;
              break;
            case 'SHA-256':
              length = 256;
              break;
            case 'SHA-384':
              length = 384;
              break;
            case 'SHA-512':
              length = 512;
              break;
            default:
              throw new TypeError('Unrecognized hash algorithm');
          }
        } else if (derivedKeyType.length !== 0) {
          length = derivedKeyType.length;
        } else {
          throw new TypeError('Invalid length.');
        }

        return length;
      }
      default:
        throw new TypeError('unreachable');
    }
  };

  const RsaOaepParamsCheck = (algorithm: RsaOaepParams) => {
    if (
      algorithm.label !== undefined &&
      !(algorithm.label instanceof ArrayBuffer || algorithm.label instanceof Uint8Array)
    ) {
      throw new TypeError('label must be Uint8Array');
    }
  };

  globalThis.CryptoKey = class {
    readonly algorithm: KeyAlgorithm;
    readonly extractable: boolean;
    readonly type: KeyType;
    readonly usages: KeyUsage[];

    // Store the randomly generate key value here
    readonly keyValue: ArrayBuffer;

    // Trick to make TypeScript happy, CryptoKey constructor is normally empty
    // but we need to construct it at some point.
    constructor(
      algorithm?: KeyAlgorithm,
      extractable?: boolean,
      type?: KeyType,
      usages?: KeyUsage[],
      keyValue?: ArrayBuffer,
    ) {
      this.algorithm = algorithm!;
      this.extractable = extractable!;
      this.type = type!;
      this.usages = usages!;

      this.keyValue = keyValue ?? LagonSync.getKeyValue();
    }
  };

  class SubtleCrypto {
    async decrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      if (typeof algorithm === 'object' && algorithm.name === 'RSA-OAEP') {
        RsaOaepParamsCheck(algorithm as RsaOaepParams);
      }
      return LagonAsync.decrypt(algorithm, key, data);
    }

    async deriveBits(
      algorithm: EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      length: number,
    ): Promise<ArrayBuffer> {
      checkDeriveAlgorithmType(algorithm);
      return LagonAsync.deriveBits(algorithm, baseKey, length);
    }

    async deriveKey(
      algorithm: EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params,
      baseKey: CryptoKey,
      derivedKeyType: AesDerivedKeyParams | HmacImportParams,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKey> {
      checkDeriveAlgorithmType(algorithm);
      checkDeriveKeyType(derivedKeyType);

      const length = getDeriveKeyLength(derivedKeyType);
      const secret = await this.deriveBits(algorithm, baseKey, length);

      return await this.importKey('raw', secret, derivedKeyType, extractable, keyUsages);
    }

    async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
      return LagonAsync.digest(algorithm, data);
    }

    async encrypt(
      algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      if (typeof algorithm === 'object' && algorithm.name === 'RSA-OAEP') {
        RsaOaepParamsCheck(algorithm as RsaOaepParams);
      }
      return LagonAsync.encrypt(algorithm, key, data);
    }

    async exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>;
    async exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey): Promise<ArrayBuffer>;
    async exportKey(format: KeyFormat, key: CryptoKey): Promise<ArrayBuffer | JsonWebKey> {
      if (!key.extractable) {
        throw new TypeError('Key is not extractable');
      }

      // TODO
      if (format === 'jwk') {
        throw new Error('jwk format is not supported');
      }

      return key.keyValue;
    }

    generateKey(
      algorithm: RsaHashedKeyGenParams | EcKeyGenParams,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage>,
    ): Promise<CryptoKeyPair>;
    generateKey(
      algorithm: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params,
      extractable: boolean,
      keyUsages: ReadonlyArray<KeyUsage>,
    ): Promise<CryptoKey>;
    async generateKey(
      algorithm: RsaHashedKeyGenParams | EcKeyGenParams | HmacKeyGenParams | AesKeyGenParams,
      extractable: boolean,
      keyUsages: Iterable<KeyUsage>,
    ): Promise<CryptoKeyPair | CryptoKey> {
      const isSymmetric = SYMMETRIC_ALGORITHMS.includes(algorithm.name);

      const arrbuf = await LagonAsync.generateKey(algorithm);

      if (isSymmetric) {
        // @ts-expect-error CryptoKey constructor is empty, but we know our implementation is not
        return new CryptoKey(algorithm, extractable, 'secret', keyUsages, arrbuf);
      } else {
        return {
          // @ts-expect-error CryptoKey constructor is empty, but we know our implementation is not
          privateKey: new CryptoKey(algorithm, extractable, 'private', keyUsages, arrbuf),
          // @ts-expect-error CryptoKey constructor is empty, but we know our implementation is not
          publicKey: new CryptoKey(algorithm, extractable, 'public', keyUsages, arrbuf),
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
      if (['raw', 'pkcs8', 'spki'].includes(format)) {
        if (!(keyData instanceof ArrayBuffer || keyData instanceof Uint8Array)) {
          throw new TypeError('keyData must be a BufferSource when format is raw, pkcs8 or spki');
        }
      } else if (format === 'jwk') {
        if (keyData instanceof ArrayBuffer || keyData instanceof Uint8Array) {
          throw new TypeError('keyData must be a JsonWebKey object when format is jwk');
        }
      }

      // @ts-expect-error CryptoKey constructor is empty, but we know our implementation is not
      return new CryptoKey(algorithm, extractable, 'secret', keyUsages, keyData);
    }

    async sign(
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      data: BufferSource,
    ): Promise<ArrayBuffer> {
      return LagonAsync.sign(algorithm, key, data);
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
      const content = await this.decrypt(unwrapAlgorithm, unwrappingKey, wrappedKey);

      return this.importKey(
        format as Exclude<KeyFormat, 'jwk'>,
        content,
        unwrappedKeyAlgorithm,
        extractable,
        keyUsages,
      );
    }

    async verify(
      algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
      key: CryptoKey,
      signature: BufferSource,
      data: BufferSource,
    ): Promise<boolean> {
      return LagonAsync.verify(algorithm, key, signature, data);
    }

    async wrapKey(
      format: KeyFormat,
      key: CryptoKey,
      wrappingKey: CryptoKey,
      wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams,
    ): Promise<ArrayBuffer> {
      const content = await this.exportKey(format as Exclude<KeyFormat, 'jwk'>, key);

      return this.encrypt(wrapAlgorithm, wrappingKey, content);
    }
  }

  globalThis.crypto = {
    getRandomValues,
    randomUUID,
    subtle: new SubtleCrypto(),
  };
})(globalThis);
