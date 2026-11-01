import test from "node:test";
import assert from "node:assert/strict";
import { stages } from "../src/stages/index.js";

test("preserves the original three-stage learning progression", () => {
  assert.deepEqual(
    stages.map((stage) => stage.id),
    ["listen", "ask", "explain"],
  );
  assert.deepEqual(
    stages.map((stage) => stage.number),
    ["01", "02", "03"],
  );
  assert.deepEqual(
    stages.map((stage) => stage.title),
    ["聽懂症狀", "問對問題", "說清照護"],
  );
  for (const stage of stages) assert.equal(stage.status, "available");
});
