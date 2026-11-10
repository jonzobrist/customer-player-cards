// Bundles src/main.tsx with esbuild and inlines it into a single, self-contained index.html.
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const result = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  legalComments: "none",
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const template = readFileSync("template.html", "utf8");
writeFileSync("index.html", template.replace("/*__APP__*/", () => js));
console.log(`index.html written (${(js.length / 1024).toFixed(1)} KB of inlined JS)`);
