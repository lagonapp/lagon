import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet" />
          <meta
            name="description"
            content="Deploy Serverless Functions at the Edge. Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
          />
          <meta property="og:url" content="https://lagon.app" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Lagon" />
          <meta
            name="twitter:card"
            content="Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
          />
          <meta
            property="og:description"
            content="Lagon is an open source platform that allows you to run TypeScript and JavaScript close to your users."
          />
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
