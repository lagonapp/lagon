import { connect } from '@planetscale/database';

const config = {
  host: 'aws.connect.psdb.cloud',
  username: process.env.PS_USERNAME,
  password: process.env.PS_PASSWORD,
};

const conn = connect(config);

export async function handler(): Promise<Response> {
  try {
    const results = await conn.execute("SELECT 'Hello World!' FROM DUAL");

    return Response.json(results);
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
