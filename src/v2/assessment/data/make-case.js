// Data-only adapter. The four approved texts and scores per question are
// transcribed without editing; rationale labels are internal scoring metadata.
const reasons = Object.freeze({
  "2": "能完整運用情境中已提供的資訊，且切題。",
  "1": "資訊正確，但有重要細節尚未交代。",
  "0": "合理承認某些資訊未曾確認或未記錄。",
  "-1": "忽略明確已知資訊，或作出與病例矛盾的說明。",
});
export function makeCase(source) {
  return {
    id: source.id,
    scenario: source.scenario,
    pre: source.pre.map(toQuestion),
    post: source.post.map(toQuestion),
  };
}
function toQuestion(q) {
  const [id, axis, prompt, choices] = q;
  return {
    id, axis, prompt,
    options: choices.map(([text, score], i) => ({
      id: "ABCD"[i], text, score, reason: reasons[String(score)],
    })),
  };
}
