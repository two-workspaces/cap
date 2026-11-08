// Runs Cap's database migrations before the server starts.
//
// Cap runs them itself 5 seconds after the server is already answering its
// healthcheck, so Railway marks a fresh deploy green mid-migration. A restart
// then (a variable change, a memory limit) leaves a half-applied migration,
// since MySQL can't roll back DDL, and every later boot fails on it. Running
// them here keeps the service unhealthy until the schema is complete.
//
// This does exactly what drizzle-orm's MySQL migrator does (same journal,
// hashes and __drizzle_migrations rows), so Cap's own run afterwards finds
// nothing to do and only runs its data backfills.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire("/app/node_modules/");
const mysql = require("mysql2/promise");
const folder = "/app/apps/web/migrations";

const journal = JSON.parse(readFileSync(`${folder}/meta/_journal.json`, "utf8"));
const migrations = journal.entries.map((e) => {
  const query = readFileSync(`${folder}/${e.tag}.sql`, "utf8");
  return {
    tag: e.tag,
    when: e.when,
    hash: createHash("sha256").update(query).digest("hex"),
    statements: query.split("--> statement-breakpoint").filter((s) => s.trim()),
  };
});

let conn;
for (let i = 0; ; i++) {
  try {
    conn = await mysql.createConnection(process.env.DATABASE_URL);
    break;
  } catch (e) {
    if (i >= 30) throw e;
    console.log(`railway: waiting for MySQL (${e.code || e.message})`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

await conn.query(
  "create table if not exists `__drizzle_migrations` (id serial primary key, hash text not null, created_at bigint)",
);
const [rows] = await conn.query(
  "select created_at from `__drizzle_migrations` order by created_at desc limit 1",
);
const last = rows.length ? Number(rows[0].created_at) : null;
const pending = migrations.filter((m) => last === null || last < m.when);
for (const m of pending) {
  for (const stmt of m.statements) await conn.query(stmt);
  await conn.query("insert into `__drizzle_migrations` (`hash`, `created_at`) values (?, ?)", [m.hash, m.when]);
}
console.log(`railway: ${pending.length} database migration(s) applied, ${migrations.length - pending.length} already there`);
await conn.end();
