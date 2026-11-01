import test from "node:test";
import assert from "node:assert/strict";
import { stages } from "../src/stages/index.js";

test("learning stages follow the listen, ask, explain progression", () => {
  assert.deepEqual(
    stages.map((stage) => stage.id),
    ["listen", "ask", "explain"],
  );
  assert.deepEqual(
    stages.map((stage) => stage.number),
    ["01", "02", "03"],
  );
});

test("every placeholder provides display metadata without claiming to be playable", () => {
  for (const stage of stages) {
    for (const field of ["title", "subtitle", "description", "skill"]) {
      assert.equal(typeof stage[field], "string");
      assert.ok(
        stage[field].trim().length > 0,
        `${stage.id}.${field} must not be empty`,
      );
    }
    assert.equal(stage.status, "planned");
    assert.equal(stage.start, undefined);
  }
});
