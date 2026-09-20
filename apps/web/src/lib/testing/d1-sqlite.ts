import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";

/** Real SQL/transactions on isolated fixtures; never connects to a remote DB. */
export function createTestD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON");
  const migrations = new URL("../../../../../migrations/", import.meta.url);
  for (const file of readdirSync(migrations).filter((name) => name.endsWith(".sql")).sort()) {
    sqlite.exec(readFileSync(new URL(file, migrations), "utf8"));
  }
  const calls: { sql: string; values: SQLInputValue[] }[] = [];
  let beforeQuery: ((sql: string) => void) | undefined;
  function prepare(sql: string, values: SQLInputValue[] = []) {
    function execute() {
      beforeQuery?.(sql);
      calls.push({ sql, values });
      const statement = sqlite.prepare(sql.replace(/\?(\d+)/g, ":p$1"));
      const bindings = Object.fromEntries(values.map((value, index) => [`p${index + 1}`, value]));
      const results = statement.all(bindings);
      return { success: true, results, meta: { changes: /^\s*(INSERT|UPDATE|DELETE)/i.test(sql) ? Number(sqlite.prepare("SELECT changes() n").get()!.n) : 0 } };
    }
    return {
      bind: (...parameters: SQLInputValue[]) => prepare(sql, parameters),
      all: async () => execute(),
      run: async () => execute(),
      first: async (column?: string) => {
        const row = execute().results[0];
        return column ? row?.[column] ?? null : row ?? null;
      },
    };
  }
  const db = {
    prepare,
    batch: async (statements: ReturnType<typeof prepare>[]) => {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;

  function addUser(id: string, isPublic = true) {
    sqlite.prepare("INSERT INTO user(id,name,email,created_at,updated_at) VALUES (?,?,?,0,0)").run(id, id, `${id}@example.test`);
    sqlite.prepare("INSERT INTO profiles(user_id,handle,display_name,is_public,created_at,updated_at) VALUES (?,?,?,?,0,0)").run(id, id, id, Number(isPublic));
    sqlite.prepare("INSERT INTO devices(id,user_id,name,token_hash,created_at) VALUES (?,?,?,?,0)").run(`device-${id}`, id, "Test device", `token-${id}`);
  }
  function addUsage(id: string, date: string, tokens: number, options: { source?: string; trust?: string; quarantined?: number; session?: string } = {}) {
    const session = options.session || crypto.randomUUID();
    sqlite.prepare(`INSERT INTO usage_daily(id,user_id,device_id,utc_date,source,model,session_fingerprint,
      input_tokens_total,fresh_input_tokens,cache_read_tokens,cache_write_tokens,output_tokens_total,reasoning_output_tokens,request_count,
      first_event_at,last_event_at,parser_version,coverage,trust_level,quarantined,created_at,updated_at)
      VALUES (?,?,?,?,?,'test-model',?,?,?,0,0,0,0,1,?,?,'test','complete',?,?,0,0)`)
      .run(crypto.randomUUID(), id, `device-${id}`, date, options.source || "codex", session, tokens, tokens, `${date}T00:00:00Z`, `${date}T00:30:00Z`, options.trust || "collector-checked", options.quarantined || 0);
  }
  return { db, sqlite, calls, addUser, addUsage, setBeforeQuery: (hook?: (sql: string) => void) => { beforeQuery = hook; } };
}
