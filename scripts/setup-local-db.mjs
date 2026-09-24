import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./sites-env.mjs";

// Only local SQLite storage is supported here. There is no remote flag or token.
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--persist-to")) {
  throw new Error("Usage: npm run db:local [-- --persist-to <local directory>]");
}
const persist = path.resolve(projectRoot, args[1] ?? ".wrangler/state");
const relative = path.relative(projectRoot, persist);
if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Local database must stay inside this checkout.");
const built = JSON.parse(await readFile(path.join(projectRoot, "dist/server/wrangler.json"), "utf8"));
const binding = built.d1_databases?.find(item => item.binding === "DB");
if (!binding) throw new Error("Build this project first with npm run build; local DB binding was not found.");
await mkdir(path.join(projectRoot, ".sites-runtime"), { recursive: true });
const config = path.join(projectRoot, ".sites-runtime/local-d1.json");
await writeFile(config, JSON.stringify({
  name: "hairmagic-local-preview",
  compatibility_date: built.compatibility_date,
  d1_databases: [{ ...binding, migrations_dir: path.join(projectRoot, "drizzle") }],
}, null, 2));
const result = spawnSync(process.execPath, [
  path.join(projectRoot, "node_modules/wrangler/bin/wrangler.js"),
  "d1", "migrations", "apply", "DB", "--local", "--config", config, "--persist-to", persist,
], { cwd: projectRoot, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, CI: "true" } });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
