/**
 * Local development database helper.
 *
 * Starts a real embedded PostgreSQL 18 server on port 5432 using the
 * platform binaries shipped with `embedded-postgres`. Production must use a
 * managed PostgreSQL instance via DATABASE_URL; this script is dev-only.
 *
 *   node scripts/dev-db.mjs start
 *   node scripts/dev-db.mjs stop
 *   node scripts/dev-db.mjs status
 */
import EmbeddedPostgres from "embedded-postgres";
import { Client } from "pg";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const root = process.cwd();
const databaseDir = path.join(root, ".toolchain", "pgdata");
const port = Number(process.env.PGPORT ?? 5432);

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

const command = process.argv[2] ?? "start";

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

async function databaseReady() {
  if (!(await isPortOpen())) return false;
  const client = new Client({
    host: "127.0.0.1",
    port,
    user: "postgres",
    password: "postgres",
    database: "postgres",
    connectionTimeoutMillis: 1000,
  });
  try {
    await client.connect();
    await client.query("select 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

try {
  if (command === "start") {
    if (await databaseReady()) {
      console.log(`PostgreSQL is already running on port ${port}.`);
      process.exit(0);
    }
    if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
      console.log("Initialising PostgreSQL data directory…");
      await pg.initialise();
    }
    await pg.start();
    try {
      await pg.createDatabase("garidekho");
    } catch {
      // Database already exists — safe to ignore.
    }
    console.log(`PostgreSQL ready on postgresql://postgres:postgres@localhost:${port}/garidekho`);
  } else if (command === "stop") {
    await pg.stop();
    console.log("PostgreSQL stopped.");
  } else if (command === "status") {
    await pg.getPgClient().end();
    console.log("PostgreSQL reachable.");
  } else {
    console.error("Usage: node scripts/dev-db.mjs <start|stop|status>");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
