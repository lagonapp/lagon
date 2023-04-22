import { connect } from '@planetscale/database';

const config = {
  host: 'aws.connect.psdb.cloud',
  username: process.env.PS_USERNAME,
  password: process.env.PS_PASSWORD,
};

const conn = connect(config);

export async function handler(): Promise<Response> {
  try {
    const results = await conn.execute('select 1 from dual where 1=?', [1]);

    return new Response(JSON.stringify(results));
  } catch (e) {
    console.error(e);
    return new Response('Internal Error');
  }
}
