// Small, consistent line icons. Text labels always carry the medical meaning.
const head = '<path d="M8 19v-3C2 12 6 3 12 3s8 9 4 13v3"/><path d="M8 21h8"/>';
const eye =
  '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
const belly = '<path d="M8 3 6 9v5c0 6 12 6 12 0V9l-2-6M6 10h12"/>';
const ear =
  '<path d="M7 8c0-8 14-7 14 1 0 5-6 5-7 9-1 5-7 3-7-1m4-8c0-4 6-4 6 0 0 3-4 3-4 6"/>';
const paths = {
  fever:
    '<path d="M10 14V4a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0Z"/><path d="M13 8v10m5-12h3m-3 4h3"/>',
  fatigue: '<path d="M5 7h14v13H5zM8 4h8M8 13h8m-5-3-2 4h5l-2 4"/>',
  aches:
    '<circle cx="12" cy="4" r="2"/><path d="M12 7v8m-7-5 7-3 7 3m-7 5-5 6m5-6 5 6M2 5l2 2m18-2-2 2"/>',
  headache: head + '<path d="m11 6-2 4h5l-2 4"/>',
  oneSide: head + '<path d="M12 6v8m-3-6-2 3 2 2"/>',
  light: eye + '<path d="m2 2 20 20M12 1v2M1 4l2 2m18-2-2 2"/>',
  throat:
    '<path d="M8 2v6l-4 4m12-10v6l4 4M12 9v12m-3-6h6"/><circle cx="12" cy="11" r="3"/>',
  runny:
    '<path d="m12 3-5 11c-1 3 6 4 8 1M6 20c-3-4 0-5 0-5s3 2 0 5Zm10 2c-3-4 0-5 0-5s3 2 0 5Z"/>',
  sneeze: '<path d="m10 3-4 10 6 2M3 19h6m5-9 6-3m-5 7h7m-8 4 6 3"/>',
  cough: '<path d="M9 3v7L3 16v4h8v-8m0 0 5 4v4h5v-4l-7-6V3m-3 4h3"/>',
  itch: eye + '<path d="M4 3h3M18 3h3m-4 18h4M3 21h3"/>',
  nausea: belly + '<path d="M8 13q2-3 4 0t4 0M3 5l-2 3"/>',
  vomit: '<path d="M5 3c9-2 13 7 6 11m-6-4v7h14M7 20h12m-5-10 6-1m-5 4 6 1"/>',
  diarrhea: belly + '<path d="M9 12h6l-6 4h6m-3 3v3m-2-2 2 2 2-2"/>',
  belly: belly + '<path d="m13 11-3 3h4l-3 3"/>',
  frequent:
    '<path d="M8 3v7c-8 3-5 10 4 10s12-7 4-10V3M12 20v3m6-18h5m-2-2 2 2-2 2"/>',
  burning:
    '<path d="M6 3v6m12-6v6M6 10c-8 11 20 11 12 0M12 10c-5 5-5 6 0 8 4-2 2-4 0-8Zm0 10v3"/>',
  lower: belly + '<ellipse cx="12" cy="16" rx="4" ry="2"/>',
  redEye: eye + '<path d="m6 7 3 3m9-3-3 3M6 17l3-3m9 3-3-3"/>',
  eyeDischarge: eye + '<path d="M20 16c-3 4-3 6 0 6s3-2 0-6Z"/>',
  wheals:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M6 9q3-5 6 0m0 6q3-5 6 0M7 17h2"/>',
  skinItch:
    '<path d="M4 18 7 9a2 2 0 0 1 3 0l-1 5 4-10a2 2 0 0 1 3 1l-3 9 4-6a2 2 0 0 1 3 2l-5 11H7M2 4h4m-2-2v4"/>',
  heartburn:
    '<path d="M5 3 2 9v12h20V9l-3-6M12 5c-7 8-6 13 0 13 6 0 5-6 0-13Z"/>',
  sourTaste:
    '<path d="M4 6h16M6 6c0 11 12 11 12 0M8 12h8m-4 4v6m4-2 4-7m-3 2 3-2 1 4"/>',
  earPain: ear + '<path d="m4 4-3 4h4l-2 4"/>',
  muffledHearing: ear + '<path d="M2 8v8m3-7v6m-4 6L22 1"/>',
  bilateralPressure:
    head + '<path d="M1 9h6m-2-2 2 2-2 2m18-2h-6m2-2-2 2 2 2"/>',
  periodCramps: belly + '<path d="M8 15q4-5 8 0m-4 0v5M3 20l2 2m16-2-2 2"/>',
};
const diseases = {
  cold: "runny",
  flu: "fever",
  allergy: "sneeze",
  gastro: "belly",
  migraine: "oneSide",
  uti: "frequent",
  viral_conjunctivitis: "redEye",
  urticaria: "wheals",
  gerd: "heartburn",
  tension_headache: "bilateralPressure",
  dysmenorrhea: "periodCramps",
  otitis_media: "earPain",
};
export function pictogram(id) {
  const path = paths[id] || paths[diseases[id]] || paths.headache;
  return `<svg class="pictogram" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}
