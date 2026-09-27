import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Media that must stay a real, byte-range-servable file.
   ---------------------------------------------------------------------------
   `vite-plugin-singlefile` sets `assetsInlineLimit: () => true`, which inlined
   every image *and* every film into index.html as base64 — a 35 MB document
   holding 22 MB of video. A `data:` URL cannot be range-requested and is not
   decoded until the whole payload has arrived, so the browser could not start
   a film until it had downloaded all of it: the hero painted its poster, sat
   still, and only then began playing. Emitting the media as ordinary files
   restores progressive streaming (faststart + range requests), so playback
   begins after the first few hundred kB instead of after the whole clip.
   Code (JS/CSS) is still inlined — the build remains a single-file app. */
const STREAMED_MEDIA = /\.(mp4|webm|mov|m4v|avif|jpe?g|png|webp)$/i;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile({
      /* Re-applied after the plugin's own recommended config, which it
         assigns last — so this is the only place `assetsInlineLimit` sticks. */
      overrideConfig: {
        build: {
          cssCodeSplit: false,
          assetsDir: "",
          chunkSizeWarningLimit: 100_000_000,
          rollupOptions: { output: { inlineDynamicImports: true } },
          assetsInlineLimit: (filePath) => !STREAMED_MEDIA.test(filePath),
        },
      },
    }),
  ],
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
  // Same for `vite preview`, which now serves the media files as well as the
  // inlined document — playback can only be reviewed over HTTP, not from the
  // file system.
  preview: {
    host: true,
    allowedHosts: true,
  },
});
