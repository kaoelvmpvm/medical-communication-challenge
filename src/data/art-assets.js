// The Vite config enumerates only existing public files; no duplicate hashed copies.
const paths = new Set(__PUBLIC_ART_PATHS__);
export function artUrl(path) {
  const file = ["webp", "png", "jpg", "jpeg", "avif", "svg"]
    .map((extension) => `${path}.${extension}`)
    .find((file) => paths.has(file));
  return file ? `${import.meta.env.BASE_URL}art/${file}` : null;
}
export const caseArtUrl = (id) => artUrl(`cases/${id}`);
export const portalArt = Object.fromEntries(
  [
    ["title", "home/title"],
    ["hero", "home/hero"],
    ["doctor", "roles/doctor"],
    ["patient", "roles/patient"],
    ["teacher", "roles/teacher"],
  ].map(([key, path]) => [key, artUrl(path)]),
);
