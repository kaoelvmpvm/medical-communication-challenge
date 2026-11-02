import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cases } from "../src/data/cases.js";
import { stageOneCases } from "../src/data/stage-one.js";
import { displayVersion } from "../src/data/version.js";
const manifest = JSON.parse(
  readFileSync(new URL("./fixtures/art-manifest.json", import.meta.url)),
);

test("all 20 current artwork files exist, remain valid WebP files, and cover all stage-one and legacy cases", () => {
  const required = [
    "home/title",
    "home/hero",
    "roles/doctor",
    "roles/patient",
    "roles/teacher",
    ...new Set([...cases, ...stageOneCases].map((c) => `cases/${c.id}`)),
  ].map((path) => `public/art/${path}.webp`).sort();
  const paths = manifest.map((a) => a.path).sort();
  assert.equal(manifest.length, 20);
  assert.equal(new Set(paths).size, manifest.length, "Artwork paths must be unique");
  assert.deepEqual(paths, required, "All teaching cases must have an assigned illustration");

  for (const item of manifest) {
    // The manifest records expected paths and sizes, not immutable hashes:
    // replacing authorized artwork must not block deployment.
    assert.equal(typeof item.sha256, "undefined", item.path);
    assert.ok(Number.isInteger(item.width) && item.width > 0, item.path);
    assert.ok(Number.isInteger(item.height) && item.height > 0, item.path);
    const data = readFileSync(new URL("../" + item.path, import.meta.url));
    assert.ok(data.length > 30, item.path);
    assert.equal(data.toString("ascii", 0, 4), "RIFF", item.path);
    assert.equal(data.toString("ascii", 8, 12), "WEBP", item.path);
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
  assert.equal(displayVersion, "V1.6");
});
