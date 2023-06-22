import { sqliteTable, int, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: int('id').primaryKey(),
  fullName: text('full_name'),
  phone: text('phone', { length: 256 }),
});
