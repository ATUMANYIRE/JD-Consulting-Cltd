import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Under `npm run dev` only, the /api functions run inside Vite with a local JSON store
// (.local-admin/store.json) and uploads written to public/media/, so the whole editor, sign-in
// included, can be tried without Vercel. Create the first account at /admin with the setup code
// "local-setup-code".
function localApi() {
  return {
    name: "local-api",
    apply: "serve",
    async configureServer(server) {
      const root = server.config.root;
      const { fileStore } = await import("./api/_lib/store.js");
      const { localMedia } = await import("./api/_lib/media.js");
      const options = {
        env: { ADMIN_SETUP_CODE: "local-setup-code" },
        store: fileStore(`${root}/.local-admin/store.json`),
        media: localMedia(root),
        secureCookies: false,
      };
      const routes = {
        "/api/auth": (await import("./api/auth.js")).createAuthHandler(options),
        "/api/content": (await import("./api/content.js")).createContentHandler(options),
        "/api/upload": (await import("./api/upload.js")).createUploadHandler(options),
      };
      server.middlewares.use((req, res, next) => {
        const handler = routes[req.url.split("?")[0]];
        return handler ? handler(req, res) : next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
})
