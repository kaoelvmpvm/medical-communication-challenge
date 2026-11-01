import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { cases } from "../src/data/cases.js";
import { displayVersion } from "../src/data/version.js";
const manifest = JSON.parse(
  readFileSync(new URL("./fixtures/art-manifest.json", import.meta.url)),
);

test("all 17 artworks exactly preserve the uploaded WebP files and required public paths", () => {
  const paths = [
    "home/title",
    "home/hero",
    "roles/doctor",
    "roles/patient",
    "roles/teacher",
    ...cases.map((c) => `cases/${c.id}`),
  ].map((p) => `public/art/${p}.webp`);
  assert.equal(manifest.length, 17);
  assert.deepEqual(manifest.map((a) => a.path).sort(), paths.sort());
  for (const item of manifest) {
    const data = readFileSync(new URL("../" + item.path, import.meta.url));
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WEBP");
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      item.sha256,
      item.path,
    );
  }
});
test("footer release label derives from the package version", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url)),
  );
  assert.equal(
    displayVersion,
    `V${pkg.version.split(".").slice(0, 2).join(".")}`,
  );
  assert.equal(displayVersion, "V1.5");
});
