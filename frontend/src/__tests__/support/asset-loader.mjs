/**
 * TEST HARNESS — module loader for node's built-in test runner.
 * -----------------------------------------------------------------------------
 * The store and provider modules are plain JavaScript the moment their asset
 * imports are answered, and the authentication components are plain JSX the
 * moment JSX is compiled. This hook does exactly those two things so
 * `node --test` can exercise real application modules without Vite:
 *
 *   · image imports (`*.png`, `*.webp`, `*.avif`, …) resolve to `""`
 *   · `*.jsx` sources are compiled with esbuild (already present with Vite),
 *     using the same automatic React runtime the app builds against
 *
 * Registered by `register-assets.mjs`:
 *
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/*.test.mjs
 */
import { readFile } from "node:fs/promises";

const ASSET_EXTENSIONS = /\.(avif|jpe?g|png|webp|gif|svg)$/i;

let esbuildModule = null;

async function loadEsbuild() {
  try {
    esbuildModule ??= await import("esbuild");
  } catch {
    throw new Error(
      "The test harness compiles JSX with esbuild, which ships with Vite. " +
        "Run `npm install` in frontend/ before running the tests."
    );
  }
  return esbuildModule;
}

export async function load(url, context, nextLoad) {
  const { pathname } = new URL(url);

  if (ASSET_EXTENSIONS.test(pathname)) {
    return { format: "module", shortCircuit: true, source: 'export default "";' };
  }

  if (pathname.endsWith(".jsx")) {
    const source = await readFile(new URL(url), "utf8");
    const { transformSync } = await loadEsbuild();
    const { code } = transformSync(source, {
      loader: "jsx",
      format: "esm",
      jsx: "automatic",
      target: "node22",
      sourcefile: pathname,
    });
    return { format: "module", shortCircuit: true, source: code };
  }

  return nextLoad(url, context);
}
