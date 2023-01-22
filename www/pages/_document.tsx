import Document, { Html, Head, Main, NextScript } from 'next/document';
import { DESCRIPTION, SHORT_DESCRIPTION } from '../lib/constants';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="description" content={`${SHORT_DESCRIPTION}. ${DESCRIPTION}`} />

          <meta property="og:url" content="https://lagon.app" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={SHORT_DESCRIPTION} />
          <meta property="og:description" content={DESCRIPTION} />
          <meta property="og:image" content="https://lagon.app/og.jpg" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta property="twitter:domain" content="lagon.app" />
          <meta property="twitter:url" content="https://lagon.app" />
          <meta name="twitter:title" content={SHORT_DESCRIPTION} />
          <meta name="twitter:description" content={DESCRIPTION} />
          <meta name="twitter:image" content="https://lagon.app/og.jpg" />
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
