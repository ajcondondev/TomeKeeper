declare module 'better-sqlite3-session-store' {
  import type { Store } from 'express-session'
  import type Database from 'better-sqlite3'

  interface SqliteStoreOptions {
    client: Database.Database
    expired?: {
      clear?: boolean
      intervalMs?: number
    }
  }

  function factory(session: { Store: typeof Store }): new (options: SqliteStoreOptions) => Store

  export default factory
}
