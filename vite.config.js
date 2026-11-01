import { defineConfig } from "vite";
import { readdirSync } from "node:fs";
const artPaths = readdirSync(new URL("./public/art/", import.meta.url), {
  recursive: true,
})
  .map((path) => path.replaceAll("\\", "/"))
  .filter((path) => /\.(webp|png|jpe?g|avif|svg)$/i.test(path));

export default defineConfig({
  define: { __PUBLIC_ART_PATHS__: JSON.stringify(artPaths) },
  base: "/medical-communication-challenge/",
});
