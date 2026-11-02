// Internal teaching identifiers only. These are not ICD or clinical diagnosis codes.
export const diseaseCatalog = Object.freeze(
  [
    ["cold", "C01", "一般感冒", "4726"],
    ["flu", "C02", "流行性感冒", "8193"],
    ["allergy", "C03", "過敏性鼻炎", "3057"],
    ["gastro", "C04", "急性腸胃炎", "6418"],
    ["migraine", "C05", "偏頭痛", "9274"],
    ["uti", "C06", "下泌尿道感染", "1536"],
    ["viral_conjunctivitis", "C07", "病毒性結膜炎", "5802"],
    ["urticaria", "C08", "蕁麻疹", "7361"],
    ["gerd", "C09", "胃食道逆流", "2948"],
    ["tension_headache", "C10", "緊縮型頭痛", "8650"],
    ["dysmenorrhea", "C11", "經痛", "4179"],
    ["otitis_media", "C12", "急性中耳炎", "9025"],
  ].map(([id, caseNumber, disease, diseaseCode]) =>
    Object.freeze({ id, caseNumber, disease, diseaseCode }),
  ),
);

// Four-digit teaching identifiers displayed *after* entering a stage-one
// fictional case. These are not the retired twelve-digit teacher load codes.
export const stageOneIdentifiers = Object.freeze(
  [
    ["cold", "S01", "一般感冒", "4726"],
    ["flu", "S02", "流行性感冒", "8193"],
    ["covid", "S03", "COVID-19", "6408"],
    ["allergy", "S04", "過敏性鼻炎", "3057"],
    ["gastro", "S05", "病毒性腸胃炎", "6612"],
    ["bacterial_gastro", "S06", "細菌性腸胃炎", "7539"],
    ["functional_dyspepsia", "S07", "功能性消化不良", "2864"],
    ["gerd", "S08", "胃食道逆流", "2948"],
  ].map(([id, caseNumber, disease, diseaseCode]) =>
    Object.freeze({ id, caseNumber, disease, diseaseCode }),
  ),
);
export function stageOneIdentifier(id) {
  return stageOneIdentifiers.find((entry) => entry.id === id);
}

export function lookupDiseaseCode(code) {
  const text = String(code).trim();
  return /^\d{4}$/.test(text)
    ? diseaseCatalog.find((entry) => entry.diseaseCode === text) ||
      stageOneIdentifiers.find((entry) => entry.diseaseCode === text) || null
    : null;
}
export function diseaseIdentifier(id) {
  return diseaseCatalog.find((entry) => entry.id === id);
}
