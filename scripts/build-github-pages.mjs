import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = fileURLToPath(new URL("../dist-pages", import.meta.url));
const index = fileURLToPath(new URL("../dist-pages/index.html", import.meta.url));
const fallback = fileURLToPath(new URL("../dist-pages/404.html", import.meta.url));
const noJekyll = fileURLToPath(new URL("../dist-pages/.nojekyll", import.meta.url));
const publicDirectory = fileURLToPath(new URL("../public", import.meta.url));
const gameSource = fileURLToPath(new URL("../app/page.tsx", import.meta.url));
const viteCli = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

function listFiles(directory, prefix = "") {
  return readdirSync(directory).flatMap((name) => {
    const absolutePath = `${directory}/${name}`;
    const relativePath = prefix ? `${prefix}/${name}` : name;
    return statSync(absolutePath).isDirectory() ? listFiles(absolutePath, relativePath) : [relativePath];
  });
}

rmSync(output, { recursive: true, force: true });

const build = spawnSync(process.execPath, [viteCli, "build", "--config", "vite.pages.config.ts"], {
  cwd: root,
  env: { ...process.env, VITE_PUBLIC_BASE_PATH: "/er/" },
  stdio: "inherit",
});

if (build.status !== 0) process.exit(build.status ?? 1);
if (!existsSync(index)) throw new Error("GitHub Pages build did not create dist-pages/index.html");

const html = readFileSync(index, "utf8");
if (!html.includes("/er/assets/")) throw new Error("GitHub Pages JavaScript or CSS is missing the /er/ prefix");
if (html.includes('src="/assets/') || html.includes('href="/assets/')) {
  throw new Error("A root-domain build asset URL remains in index.html");
}

const missingPublicAssets = listFiles(publicDirectory).filter((relativePath) => !existsSync(`${output}/${relativePath}`));
if (missingPublicAssets.length > 0) {
  throw new Error(`GitHub Pages build omitted public assets: ${missingPublicAssets.slice(0, 10).join(", ")}`);
}

const publicAssetPaths = new Set(listFiles(publicDirectory).map((relativePath) => relativePath.replaceAll("\\", "/")));
const literalAssetReferences = [...readFileSync(gameSource, "utf8").matchAll(/["'`](?<assetPath>(?:game-assets|ui-icons)\/[^"'`$?]+\.(?:png|mp3|json|gif|webp))(?:\?[^"'`]*)?["'`]/g)]
  .map((match) => match.groups.assetPath);
const missingLiteralAssets = [...new Set(literalAssetReferences.filter((assetPath) => !publicAssetPaths.has(assetPath)))];
if (missingLiteralAssets.length > 0) {
  throw new Error(`Asset path case mismatch or missing source files: ${missingLiteralAssets.join(", ")}`);
}

const compiledSource = listFiles(output)
  .filter((relativePath) => /\.(?:html|css|js)$/i.test(relativePath))
  .map((relativePath) => readFileSync(`${output}/${relativePath}`, "utf8"))
  .join("\n");
if (/["']\/(?:game-assets|ui-icons|assets)\//.test(compiledSource)) {
  throw new Error("A root-domain game asset URL remains in the production bundle");
}

copyFileSync(index, fallback);
writeFileSync(noJekyll, "");
console.log(`GitHub Pages static build verified: index.html, /er/ paths, and ${listFiles(publicDirectory).length} public assets are ready.`);
