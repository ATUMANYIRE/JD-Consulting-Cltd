import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Key for trying the /admin editor locally: http://localhost:5173/admin#key=local-test-key-only
const LOCAL_ADMIN_KEY = 'local-test-key-only'

// Under `npm run dev` only, /api/content saves to this working copy (src/content/*.json and
// public/media/) instead of committing to GitHub, so the editor can be tested before deploying.
function localContentApi() {
  return {
    name: 'local-content-api',
    apply: 'serve',
    async configureServer(server) {
      const { createHandler, localRepo } = await import('./api/content.js')
      const handler = createHandler({ env: { ADMIN_KEY: LOCAL_ADMIN_KEY }, repo: localRepo(server.config.root) })
      server.middlewares.use('/api/content', (req, res) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          req.body = body
          handler(req, res)
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localContentApi()],
})
