// Only known files enter the build manifest. There is no speculative HTTP request for missing art.
const files = import.meta.glob(
  "/public/art/cases/*.{webp,png,jpg,jpeg,avif,svg}",
  { eager: true, query: "?url", import: "default" },
);
export function caseArtUrl(id) {
  const path = Object.keys(files).find(
    (path) =>
      path
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, "") === id,
  );
  return path ? files[path] : null;
}
