import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
await mkdir(new URL(".sites-runtime/", root), { recursive: true });
await writeFile(new URL(".sites-runtime/execution-profile.json", root), JSON.stringify({ executionProfile: "portable" }) + "\n");
const target = new URL(".dev.vars", root);
try {
  await access(target, constants.F_OK);
  console.log("Konfigurasi lokal yang sudah ada dipertahankan.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await copyFile(new URL(".dev.vars.example", root), target, constants.COPYFILE_EXCL);
  console.log("Konfigurasi preview dibuat; ruang owner dinonaktifkan di preview lokal.");
}
console.log(`Proyek: ${fileURLToPath(root)}\nJalankan npm run dev setelah setup selesai. Port preview tetap private.`);
