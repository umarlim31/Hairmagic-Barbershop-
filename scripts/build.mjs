import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
await cp("public/index.html", "dist/index.html");
await cp("public/feedback.html", "dist/feedback.html");
await cp("public/owner.html", "dist/owner.html");
await cp("public/styles.css", "dist/assets/styles.css");
await cp("public/runtime-config.js", "dist/runtime-config.js");
if (!existsSync(".compiled")) throw new Error("Compiled TypeScript output missing.");
await cp(".compiled", "dist/assets", { recursive: true });
console.log("Hairmagic build ready in dist/");
