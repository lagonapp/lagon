export async function handler(request: Request): Promise<Response> {
  const response = await fetch('https://randomuser.me/api/');
  const json = await response.json();

  return new Response(`Hello ${json.results[0].name.first}!`, {
    headers: {
      'content-type': 'text/html',
    },
  });
}
