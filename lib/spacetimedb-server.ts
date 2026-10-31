import { DbConnection, tables } from '../src/module_bindings';
import { User } from '../src/module_bindings/types';
import type { Infer } from 'spacetimedb';

const HOST = process.env.SPACETIMEDB_HOST ?? 'wss://maincloud.spacetimedb.com';
const DB_NAME = process.env.SPACETIMEDB_DB_NAME ?? 'nextjs-ts';

export type UserData = Infer<typeof User>;

/**
 * Fetches the initial list of users from SpacetimeDB.
 * This function is designed for use in Next.js Server Components.
 *
 * It establishes a WebSocket connection, subscribes to the user table,
 * waits for the initial data, and then disconnects.
 */
export async function fetchPeople(): Promise<UserData[]> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('SpacetimeDB connection timeout'));
    }, 10000);

    const connection = DbConnection.builder()
      .withUri(HOST)
      .withDatabaseName(DB_NAME)
      .onConnect(conn => {
        // Subscribe to all users
        conn
          .subscriptionBuilder()
          .onApplied(() => {
            clearTimeout(timeoutId);
            // Get all users from the cache
            const users = Array.from(conn.db.user.iter());
            conn.disconnect();
            resolve(users);
          })
          .onError((ctx) => {
            clearTimeout(timeoutId);
            conn.disconnect();
            reject(ctx.event ?? new Error('Subscription error'));
          })
          .subscribe(tables.user);
      })
      .onConnectError((_ctx, error) => {
        clearTimeout(timeoutId);
        reject(error);
      })
      .build();
  });
}
