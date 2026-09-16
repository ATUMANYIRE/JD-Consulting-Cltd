# JD Mining Consulting Ltd — Website

Marketing website for **JD Mining Consulting Ltd**, a Rwanda-based advisory and engineering firm serving the mining, quarrying and energy sectors across East and Central Africa.

## Highlights

- **Scroll-driven 3D hero:** a real-time underground mine scene (miners, ore-bearing rock face, timber-framed tunnel, ore cart, sparks). Scrolling flies the camera from the rock face down the tunnel toward the light, with a message at each stage. Clicking anywhere on the scene makes the miner strike the rock.
- **Three languages:** English, Français and Kinyarwanda, chosen from the navbar language menu (the choice is remembered).
- **Five service pillars:** each with an animated illustration and its own detail page.
- **Interactive sections:** "How we work" timeline, flip-card mineral tiles (Sn, Ta, W, Au, Li, C), results cards and audience cards.
- **Contact page:** a guided three-step form (topic cards, details, message) and a one-click copy of the email address.
- **Custom touches:** a layered mountain-range footer with parallax, topographic patterns on navy panels, and mountain and pickaxe cursors.
- **Accessibility:** respects the operating system's "reduce motion" setting and works at phone widths.

## Tech stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Framer Motion](https://www.framer.com/motion/) for animation
- [three.js](https://threejs.org) with [React Three Fiber](https://r3f.docs.pmnd.rs) and drei for the 3D hero

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the development server       |
| `npm run build`   | Build for production into `dist/`  |
| `npm run preview` | Preview the production build       |
| `npm run lint`    | Lint with oxlint                   |

## Project structure

```
src/
  components/   Navbar, Footer, language menu, illustrations, motion helpers
  pages/        Home, About, Services, ServiceDetail, Contact
  i18n/         Translations (en, fr, rw) and language context
  three/        3D mine scene: miner figures, procedural textures and geometry
  data/         Service pillar order
```

All user-facing text lives in `src/i18n/translations.js`. Add any new string in all three languages.

## Deployment (Vercel)

1. Import this repository in Vercel.
2. Vercel detects Vite automatically: the build command is `npm run build` and the output directory is `dist`.
3. `vercel.json` rewrites every route to `index.html`, so direct links such as `/about` work.

## Still to come

- Official logo, real photography and full contact details (phone, address, social links)
- A contact form backend (the form currently opens the visitor's email app)
- Native-speaker review of the French and Kinyarwanda text
- Custom domain and SEO metadata
