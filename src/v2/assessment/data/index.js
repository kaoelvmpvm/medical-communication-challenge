import { cold } from "./cold.js";
import { allergy } from "./allergy.js";
import { gastro } from "./gastro.js";
import { tensionHeadache } from "./tension-headache.js";
import { CASE_CATALOG } from "../constants.js";
import { validateCaseBank } from "../scoring.js";

const banks = Object.freeze({cold, allergy, gastro, tension_headache: tensionHeadache});
if (CASE_CATALOG.length !== Object.keys(banks).length ||
  CASE_CATALOG.some(({id}) => !banks[id])) {
  throw new Error("V2 assessment catalog does not match the approved banks");
}
for (const bank of Object.values(banks)) validateCaseBank(bank);
export const ASSESSMENT_BANKS = banks;
export function getAssessmentBank(caseId) {
  return Object.hasOwn(banks, caseId) ? banks[caseId] : null;
}
