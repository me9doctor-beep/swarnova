import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
//
// Production output is the standard Vite layout — `dist/index.html` plus
// content-hashed files under `dist/assets/` — so campaign footage and imagery
// ship as separate, cacheable, range-requestable files that the browser fetches
// when the page asks for them. (The build used to be one self-contained
// `index.html` via vite-plugin-singlefile, which base64-inlined every MP4 and
// image and made the document ~35 MB.) Deploy the whole `dist/` directory,
// served from the site root with an SPA fallback to `index.html` — the latter
// was already required by the browser router.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Dev-server only (never affects the production build): bind to every
  // interface and accept proxied preview hosts, so the app can be reviewed
  // from a hosted sandbox as well as from localhost.
  server: {
    host: true,
    allowedHosts: true,
  },
});
