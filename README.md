# Reddit Ads Creative Machine

A bring-your-own-key (BYOK) tool that turns a short brief into a full Reddit Ads creative package — angles, headlines, post copy, image prompts, subreddit targeting, and 1:1 ad images — using Google's Gemini API.

The app is a fully client-side React SPA. Each user pastes their own Gemini API key on first launch; the key is stored only in their browser and is sent directly to the Google Generative AI API. Nothing is proxied through a server, so there are no secrets to manage and hosting is free on Vercel.

## Features

- **Campaign Builder** — brand, vertical, offer, CTA, tone, goal, and creative count.
- **Strategic generation** — angles, Reddit-native titles, post bodies, and subreddit targeting grouped by intent.
- **Image generation** — high-detail "Nano Banana" prompts plus on-demand 1:1 image generation.
- **Library** — every campaign auto-saves to your browser and is browsable, copyable, and deletable.
- **Templates** — vertical presets to jump-start common campaign types.
- **BYOK setup screen** — link to Google AI Studio, password-style input, reset key from the sidebar.

## Tech stack

- React 19 + Vite 6
- TypeScript (strict)
- Tailwind CSS 4
- shadcn/ui + lucide-react + sonner
- React Router 7
- React Hook Form
- @google/genai (Gemini SDK)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and paste your Gemini API key on the setup screen. Get one for free at https://aistudio.google.com/apikey.

No `.env` file is required — the app does not read any environment variables.

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

## Security model

- The Gemini API key is stored in `localStorage` under the `reddit_ads_gemini_api_key` key.
- All Gemini calls are made directly from the user's browser to `generativelanguage.googleapis.com` using the `@google/genai` SDK.
- The key is never sent to any server controlled by this project.
- Anyone with access to a particular browser profile can read the key from devtools — this is the standard trade-off for BYOK SPAs. Don't paste shared / billable keys into someone else's machine.

## License

MIT — see [LICENSE](LICENSE).
