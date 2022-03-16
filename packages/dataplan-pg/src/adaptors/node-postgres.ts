// TODO: don't import this, it should not be a dependency.
// ALTERNATIVELY: make this only importable from direct path.
import LRU from "@graphile/lru";
import type { Pool, QueryArrayConfig, QueryConfig } from "pg";

import type { PgClient, PgClientQuery, WithPgClient } from "../executor";

// Set `DATAPLAN_PG_PREPARED_STATEMENT_CACHE_SIZE=0` to disable prepared statements
const cacheSizeFromEnv = process.env.DATAPLAN_PG_PREPARED_STATEMENT_CACHE_SIZE
  ? parseInt(process.env.DATAPLAN_PG_PREPARED_STATEMENT_CACHE_SIZE, 10)
  : null;
const PREPARED_STATEMENT_CACHE_SIZE =
  !!cacheSizeFromEnv || cacheSizeFromEnv === 0 ? cacheSizeFromEnv : 100;

const $$isSetup = Symbol("isConfiguredForDataplanPg");

const DONT_DISABLE_JIT = process.env.DATAPLAN_PG_DONT_DISABLE_JIT === "1";

export function makeNodePostgresWithPgClient(pool: Pool): WithPgClient {
  return async (pgSettings, callback) => {
    const pgClient = await pool.connect();
    if (!pgClient[$$isSetup]) {
      pgClient[$$isSetup] = true;
      if (!DONT_DISABLE_JIT) {
        /*
         * > JIT compilation is beneficial primarily for long-running CPU-bound
         * > queries. Frequently these will be analytical queries. For short
         * > queries the added overhead of performing JIT compilation will
         * > often be higher than the time it can save.
         * -- https://www.postgresql.org/docs/14/jit-decision.html
         *
         * PostGraphile is designed for extremely fast queries, but sometimes
         * user code can make Postgres think the cost of the query is going to
         * be very high (this is especially the case when lots of computed
         * column functions are used), and thus enables JIT. In testing we've
         * seen queries that would take 50ms with `jit=off` take 8200ms with
         * jit on. As such we've made the decision to disable jit for all
         * queries.
         *
         * If you don't agree with our decision, disable this by setting the
         * environmental variable `DATAPLAN_PG_DONT_DISABLE_JIT=1`.
         */
        pgClient.query("set jit = off;").catch((e) => {
          console.error(
            `Error occurred applying @dataplan/pg global Postgres settings`,
          );
        });
      }
    }
    /** Transaction level; 0 = no transaction; 1 = begin; 2,... = savepoint */
    let txLevel = 0;
    const pgSettingsEntries = pgSettings
      ? Object.entries(pgSettings).map(([k, v]) => [k, String(v)])
      : [];
    /** If transactions become unpaired, prevent any further usage */
    let catastrophicFailure: Error | null = null;

    try {
      const client: PgClient = {
        async query<TData>(opts: PgClientQuery) {
          if (catastrophicFailure !== null) {
            throw catastrophicFailure;
          }
          const needsTx = txLevel === 0 && pgSettingsEntries.length > 0;
          if (needsTx) {
            // NOTE: this is **NOT** inside the 'try' because if we fail to start
            // the transaction then we must not release it.
            await this.startTransaction();
          }
          try {
            const { text, name, values, arrayMode } = opts;
            // TODO: support named queries.
            const queryObj: QueryConfig | QueryArrayConfig = arrayMode
              ? {
                  text,
                  values,
                  rowMode: "array",
                }
              : {
                  text,
                  values,
                };

            if (PREPARED_STATEMENT_CACHE_SIZE > 0 && name != null) {
              // Hacking into pgClient internals - this is dangerous, but it's the only way I know to get a prepared statement LRU
              const connection = (pgClient as any).connection;
              if (connection && connection.parsedStatements) {
                if (!connection._graphilePreparedStatementCache) {
                  connection._graphilePreparedStatementCache = new LRU({
                    maxLength: PREPARED_STATEMENT_CACHE_SIZE,
                    dispose(key) {
                      if (connection.parsedStatements[key]) {
                        pgClient
                          .query(`deallocate ${pgClient.escapeIdentifier(key)}`)
                          .then(() => {
                            delete connection.parsedStatements[key];
                          })
                          .catch((e) => {
                            // eslint-disable-next-line no-console
                            console.error("Error releasing prepared query", e);
                          });
                      }
                    },
                  });
                }
                if (!connection._graphilePreparedStatementCache.get(name)) {
                  // We're relying on dispose to clear out the old ones.
                  connection._graphilePreparedStatementCache.set(name, true);
                }
                queryObj.name = name;
              }
            }

            const result = await pgClient.query<TData>(queryObj);

            if (needsTx) {
              await this.commitTransaction();
            }
            return result;
          } catch (e) {
            if (needsTx) {
              try {
                await this.rollbackTransaction();
              } catch (rollbackError) {
                console.error(
                  `Error occurred during rollback: ${rollbackError.message}`,
                );
                throw e;
              }
            }
            throw e;
          }
        },
        async startTransaction() {
          if (catastrophicFailure !== null) {
            throw catastrophicFailure;
          }
          if (txLevel === 0) {
            await pgClient.query("begin");
            if (pgSettingsEntries.length > 0) {
              await pgClient.query({
                text: "select set_config(el->>0, el->>1, true) from json_array_elements($1::json) el",
                values: [JSON.stringify(pgSettingsEntries)],
              });
            }
          } else {
            await pgClient.query({ text: `savepoint tx${txLevel}` });
          }
          txLevel++;
        },
        async commitTransaction() {
          txLevel--;
          if (txLevel === 0) {
            await pgClient.query({ text: "commit" });
          } else if (txLevel > 0) {
            await pgClient.query({ text: `release savepoint tx${txLevel}` });
          } else {
            catastrophicFailure = new Error(
              `Catastrophic failure: txLevel is ${txLevel}; you have unbalanced startTransaction/commitTransaction/rollbackTransaction calls. Unsafe to continue; this Postgres client is now inactivated.`,
            );
            throw catastrophicFailure;
          }
        },
        async rollbackTransaction() {
          txLevel--;
          if (txLevel === 0) {
            await pgClient.query({ text: "rollback" });
          } else if (txLevel > 0) {
            await pgClient.query({
              text: `rollback to savepoint tx${txLevel}`,
            });
          } else {
            catastrophicFailure = new Error(
              `Catastrophic failure: txLevel is ${txLevel}; you have unbalanced startTransaction/commitTransaction/rollbackTransaction calls. Unsafe to continue; this Postgres client is now inactivated.`,
            );
            throw catastrophicFailure;
          }
        },
      };
      return await callback(client);
    } finally {
      pgClient.release();
    }
  };
}
