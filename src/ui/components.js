export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
export const button = (
  label,
  action,
  { kind = "secondary", extra = "", disabled = false } = {},
) =>
  `<button type="button" class="button ${kind}" data-action="${action}" ${extra} ${disabled ? "disabled" : ""}>${label}</button>`;
export const icon = (name) =>
  ({
    cross: "✚",
    doctor: "＋",
    patient: "◎",
    arrow: "→",
    lock: "▣",
    yes: "✓",
    no: "×",
  })[name] || "•";
export function notice(text, kind = "") {
  return `<div class="notice ${kind}"><span aria-hidden="true">${kind === "warning" ? "!" : "ⓘ"}</span><p>${text}</p></div>`;
}
export const stageLabels = ["聽懂症狀", "問對問題", "說清照護"];
