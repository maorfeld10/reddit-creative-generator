# Reddit Ads Creative Machine

A zero-friction tool that turns a short brief into a full Reddit Ads creative package — angles, headlines, post copy, image prompts, subreddit targeting, and 1:1 ad images.

No API keys, no signup. The app runs 100% in the browser and calls Google's Gemini (text) and Imagen (image) models through [Puter.js](https://developer.puter.com/), so end users don't need to bring their own keys. Hosting is free on Vercel because there's no backend.

## Features

- **Campaign Builder** — brand, vertical, offer, CTA, tone, goal, and creative count.
- **Strategic generation** — angles, Reddit-native titles, post bodies, and subreddit targeting grouped by intent, powered by `google/gemini-2.5-flash` via Puter.
- **Image generation** — 1:1 ad creatives powered by `google/imagen-4.0-fast` via Puter.
- **Library** — every campaign auto-saves to your browser and is browsable, copyable, and deletable.
- **Templates** — vertical presets to jump-start common campaign types.

## Tech stack

- React 19 + Vite 6
- TypeScript (strict)
- Tailwind CSS 4
- shadcn/ui + lucide-react + sonner
- React Router 7
- React Hook Form
- [@heyputer/puter.js](https://developer.puter.com/) for all AI calls

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No `.env` file and no API keys are required.

## Type-check / build

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build into ./dist
npm run preview     # serve ./dist locally
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, click **Add New… → Project** and import the repo.
3. Vercel auto-detects Vite. Leave the defaults:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**. No environment variables needed.

`vercel.json` rewrites all routes to `/` so React Router's client-side routes work on direct refresh.

## How the AI calls work

All text and image generation happens in the browser through Puter.js:

- **Text (campaign JSON):** `puter.ai.chat(prompt, { model: 'google/gemini-2.5-flash' })`
- **Images (1:1 creatives):** `puter.ai.txt2img(prompt, { model: 'google/imagen-4.0-fast', aspect_ratio: '1:1' })`

Puter handles auth, billing, and rate limiting on their end; end users don't see any of it. If Puter is temporarily unavailable, users see a Sonner toast with the exact error and can retry.

Model names are centralized as `TEXT_MODEL` and `IMAGE_MODEL` constants in [src/lib/gemini.ts](src/lib/gemini.ts) so they're easy to swap.

## License

MIT — see [LICENSE](LICENSE).
