import { S3Client } from '@aws-sdk/client-s3';

declare const global: typeof globalThis & {
  s3: S3Client;
};

const s3 =
  global.s3 ||
  new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  });

if (process.env.NODE_ENV === 'development') global.s3 = s3;

export default s3;
