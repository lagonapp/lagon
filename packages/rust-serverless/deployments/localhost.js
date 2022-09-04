export function handler(request) {
  return new Response(
    `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Serverless Rust</title>
    <link rel="stylesheet" href="/index.css">
  </head>
  <body>
    <h1>Serverless Rust</h1>
  </body>
</html>
  `,
    {
      headers: { 'content-type': 'text/html' },
    },
  );
}
