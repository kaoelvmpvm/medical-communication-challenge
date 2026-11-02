import test from "node:test";
import assert from "node:assert/strict";
import {
  diseaseCatalog,
  lookupDiseaseCode,
  diseaseIdentifier,
  stageOneIdentifiers,
  stageOneIdentifier,
} from "../src/data/disease-catalog.js";
import { cases, patientView } from "../src/data/cases.js";
import { stageOneCases } from "../src/data/stage-one.js";

test("all twelve teaching identifiers are unique fixed four-digit strings, not loading codes", () => {
  const expected = {
    cold: "4726",
    flu: "8193",
    allergy: "3057",
    gastro: "6418",
    migraine: "9274",
    uti: "1536",
    viral_conjunctivitis: "5802",
    urticaria: "7361",
    gerd: "2948",
    tension_headache: "8650",
    dysmenorrhea: "4179",
    otitis_media: "9025",
  };
  assert.equal(diseaseCatalog.length, 12);
  assert.equal(
    new Set(diseaseCatalog.map((entry) => entry.diseaseCode)).size,
    12,
  );
  diseaseCatalog.forEach((entry, index) => {
    assert.match(entry.diseaseCode, /^\d{4}$/);
    assert.equal(entry.diseaseCode, expected[entry.id]);
    assert.equal(entry.caseNumber, "C" + String(index + 1).padStart(2, "0"));
    assert.equal(lookupDiseaseCode(entry.diseaseCode), entry);
    assert.equal(diseaseIdentifier(entry.id), entry);
  });
  for (const code of ["0000", "12", "47260", "abcd", ""])
    assert.equal(lookupDiseaseCode(code), null);
});
test("patient projection supplies a stable teaching code and art key but no disease name or evidence map", () => {
  for (const entry of cases) {
    const view = patientView(entry);
    assert.equal(view.diseaseCode, diseaseIdentifier(entry.id).diseaseCode);
    assert.equal(view.artId, entry.id);
    assert.equal(view.disease, undefined);
    assert.equal(view.caseNumber, undefined);
    assert.equal(view.evidence, undefined);
    assert.deepEqual(view.notes, entry.notes);
  }
});

test("missing art renders a fixed placeholder without an image URL or any fetch", async () => {
  const { caseArt } = await import("../src/ui/case-art.js");
  const missing = caseArt();
  assert.ok(missing.includes("劇情圖片"));
  assert.ok(!missing.includes("<img"));
  assert.ok(!missing.includes("src="));
  const existing = caseArt(
    "/medical-communication-challenge/art/cases/example.webp",
  );
  assert.ok(existing.includes("<img"));
  assert.ok(existing.includes('alt="模擬病例的情境插畫"'));
});

test("extended twelve-digit loading codes round-trip all twelve identifiers, preserving legacy six-case decoding", async () => {
  const { makeCode, readCode } = await import("../src/game/codes.js");
  for (let index = 0; index < 12; index++)
    for (const stage of [1, 2, 3])
      for (let round = 1; round <= 5; round++) {
        const code = makeCode(index, stage, round);
        assert.equal(code.length, 12);
        assert.deepEqual(readCode(code), {
          code,
          stage,
          round,
          caseIndex: index,
        });
      }
  for (const entry of diseaseCatalog)
    assert.throws(() => readCode(entry.diseaseCode));
  // A fixed code from the old modulo-six algorithm keeps its old case index.
  const payload = "1234567210";
  const checksum = String(
    [...payload].reduce(
      (sum, digit, i) => (sum * 17 + Number(digit) * (i + 3)) % 97,
      0,
    ),
  ).padStart(2, "0");
  assert.equal(
    readCode(payload + checksum).caseIndex,
    (0 - (1234567 % 6) + 6) % 6,
  );
});

test("stage-one patients show valid unique four-digit identifiers including new diseases", () => {
  assert.equal(stageOneIdentifiers.length, 8);
  const union = new Set([...diseaseCatalog.map(x => x.diseaseCode), ...stageOneIdentifiers.map(x => x.diseaseCode)]);
  assert.equal(union.size, 16);
  for (const entry of stageOneCases) {
    const id = stageOneIdentifier(entry.id);
    assert.ok(id);
    assert.equal(entry.diseaseCode, id.diseaseCode);
    assert.match(entry.diseaseCode, /^[0-9]{4}$/);
    assert.equal(patientView(entry).diseaseCode, entry.diseaseCode);
    assert.equal(lookupDiseaseCode(entry.diseaseCode).diseaseCode, entry.diseaseCode);
  }
  assert.equal(lookupDiseaseCode("6612").disease, "病毒性腸胃炎");
  assert.equal(lookupDiseaseCode("6418").disease, "急性腸胃炎");
});
