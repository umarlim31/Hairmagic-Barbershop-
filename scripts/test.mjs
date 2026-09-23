import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync(".test-build", { recursive: true, force: true });
execFileSync("tsc", ["--target","ES2022","--module","ES2022","--moduleResolution","Bundler","--outDir",".test-build","src/lib/booking.ts"], { stdio: "inherit" });
execFileSync("node", ["--test","tests/booking.test.mjs"], { stdio: "inherit" });
