import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const repo = process.argv[2];
if (process.argv.length !== 3 || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repo || "")) {
  throw new Error("Gunakan: npm run github:publish -- NAMA_AKUN/hairmagic-website");
}
function run(command, args, inherit = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: inherit ? "inherit" : "pipe" });
  if (result.error) throw new Error(`${command} belum tersedia. Siapkan Git dan GitHub CLI dahulu.`);
  return result;
}
if (run("git", ["status", "--porcelain"]).stdout.trim()) throw new Error("Commit atau rapikan perubahan lokal dahulu; hanya commit yang akan dikirim.");
if (run("git", ["branch", "--show-current"]).stdout.trim() !== "main") throw new Error("Jalankan dari branch main yang sudah diverifikasi.");
const files = run("git", ["ls-files"]).stdout.split("\n");
if (files.some(file => /(^|\/)(\.env($|\.)|\.dev\.vars($|\.)|backups\/)/.test(file) && !file.endsWith(".example"))) {
  throw new Error("Ada file konfigurasi privat atau backup yang terlacak. Hapus dari tracking sebelum publikasi.");
}
if (run("gh", ["auth", "status"]).status !== 0) throw new Error("Login GitHub dahulu dengan gh auth login.");
if (run("gh", ["repo", "view", repo, "--json", "nameWithOwner"]).status === 0) {
  throw new Error("Repository tujuan sudah ada. Tidak ada perubahan dilakukan; periksa dan gunakan remote yang benar secara manual.");
}
if (run("git", ["remote"]).stdout.split("\n").includes("github")) throw new Error("Remote github sudah ada. Periksa alamatnya sebelum push.");
const result = run("gh", ["repo", "create", repo, "--private", "--source", cwd, "--remote", "github", "--push"], true);
if (result.status !== 0) throw new Error("GitHub belum selesai dibuat/dikirim. Periksa status akun dan repository sebelum mencoba lagi.");
console.log(`Kode tersimpan di https://github.com/${repo}. Remote Sites dipertahankan.`);
