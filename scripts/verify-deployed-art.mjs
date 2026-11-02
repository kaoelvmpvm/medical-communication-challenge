import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const base = new URL(process.argv[2]);
if (base.protocol !== "https:" && base.hostname !== "127.0.0.1")
  throw new Error("Expected HTTPS deployment URL");
const manifest = JSON.parse(
  await readFile(
    new URL("../tests/fixtures/art-manifest.json", import.meta.url),
  ),
);
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
for (const asset of manifest) {
  const local = await readFile(new URL("../" + asset.path, import.meta.url));
  const expectedHash = hash(local);
  const url = new URL(asset.path.replace(/^public\//, ""), base);
  let error;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (!response.headers.get("content-type")?.includes("image/webp"))
        throw new Error("Expected image/webp");
      if (hash(body) !== expectedHash)
        throw new Error("Deployed file does not match the current repository source");
      console.log(`PASS ${url} (${body.length} bytes)`);
      error = null;
      break;
    } catch (caught) {
      error = caught;
      if (attempt < 5) await delay(5000);
    }
  }
  if (error) throw new Error(`${url}: ${error.message}`);
}
console.log(
  `Verified ${manifest.length} deployed WebP URLs against current source checksums.`,
);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `### V1.6 deployed artwork\n\nAll ${manifest.length} public WebP URLs returned image/webp and matched the current repository source SHA-256 checksums.\n\n${manifest.map((a) => `- ${new URL(a.path.replace(/^public\//, ""), base)}`).join("\n")}\n`,
  );
}
