import Document, { Html, Head, Main, NextScript } from 'next/document';
import { REGIONS } from '../lib/constants';

const DESCRIPTION = `Lagon is an open-source runtime and platform that allows developers to run JavaScript in ${REGIONS} regions all around the world.`;

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="description" content={`Deploy Serverless Functions at the Edge. ${DESCRIPTION}`} />
          <meta property="og:url" content="https://lagon.app" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Lagon" />
          <meta name="twitter:card" content={DESCRIPTION} />
          <meta property="og:description" content={DESCRIPTION} />
          <meta property="og:image" content="https://i.imgur.com/lqVcA5Y.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
