import { getXataClient } from './xata';

const xataClient = getXataClient();

export async function handler(): Promise<Response> {
  try {
    const results = await xataClient.db.test.getAll()
    return Response.json(results)
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
