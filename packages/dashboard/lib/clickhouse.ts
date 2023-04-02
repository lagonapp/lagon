import { ClickHouse } from 'clickhouse';

declare const global: typeof globalThis & {
  clickhouse: ClickHouse;
};

const clickhouse =
  global.clickhouse ||
  new ClickHouse({
    url: process.env.CLICKHOUSE_URL,
    basicAuth: {
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
    },
  });

if (process.env.NODE_ENV === 'development') global.clickhouse = clickhouse;

export default clickhouse;
