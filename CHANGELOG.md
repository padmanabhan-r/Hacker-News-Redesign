# Changelog

## v0.2.0 — "Open Mic" — 2026-05-06

First public release after the ElevenHacks hackathon polish pass. The product gets a real home on Cloudflare R2, a louder voice on the landing page, a "buy me a coffee" path for anyone who wants to keep the lights on, and a tighter, leaner codebase.

---

### Highlights

**HN++ Pod moves to Cloudflare R2**
- `lib/podcast-store.ts` rewritten on top of `@aws-sdk/client-s3` + new `lib/r2-client.ts`
- Episodes now stored as `podcast/{date}.mp3` / `.json` / `.script.json` + `podcast/index.json`
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_PUBLIC_BASE_URL` replace the old `PODCAST_STORE_DIR` filesystem store
- Cron retimed to **01:30 UTC = 07:00 IST** (`.github/workflows/podcast-cron.yml: '30 1 * * *'`)

**Support / Buy me a coffee**
- New `components/kofi-button.tsx` — single component, two variants (sidebar + landing footer)
- Click opens a centered popup with the ko-fi logomark, the discontinue/donate copy, and a "Buy me a coffee" CTA → `ko-fi.com/padmanabhan`
- Sidebar variant pinned to the bottom of the Info section in `feed-shell.tsx`
- Landing footer variant inline alongside the existing footer links
- README gets a Support section with a live shields.io ko-fi badge

**Landing page polish**
- Tagline rewritten: "A complete Hacker News overhaul — redesigned, rethought, and now with a voice."
- New web-only kicker pill below the hero CTAs ("Designed for web · best on desktop for now"), styled to match the existing top kicker
- Safari bot popup centering fix (`100dvh` viewport)
- Show HN feature surfaced

**Voice-over assets**
- `scripts/gen_hnpp_voiceover.py` generates the demo voice-over MP3s via the ElevenLabs API
- Voice tuned for product-marketer delivery (stability 0.25, style 0.70, speed 1.05, speaker boost on)

---

### Codebase hygiene

- **Dead code purge** — removed 8 unused components (`sidebar`, `page-transition`, `trending-sidebar`, `post-feed`, `story-detail`, `post-card`, `comments`, `listen-button`). Live nav/feed/detail/Listen logic all lives in `feed-shell.tsx`; `.pt-cover` route-transition JSX is inlined per route.
- Removed 7 orphan assets from `public/` (placeholder images + Cloudflare/GH-Actions logos no longer rendered)
- Removed empty `app/api/alignment/` placeholder dir
- Confirmed clean: no hardcoded API keys, agent IDs, or secrets anywhere in source or git history; all credentials accessed via `process.env` in server-side code only
- README Next.js version corrected: 15 → 16 (matches `package.json` 16.2.4)
- CHANGELOG, MIT license, screenshots-first README, jargon trimmed
- Podcast badge color: violet → accent orange (matches the rest of the palette)

---

### Cost / latency

- Podcast duration halved from 10 minutes to ~5 minutes — cuts ElevenLabs `text-to-dialogue` spend roughly in half per daily episode
- Voice-search prompt trimmed from 1500 → 700 tokens
- `/api/listen` still hits ≤ 3s to first audio byte (Firecrawl 4s timeout + Gemini Flash thinking-LOW + ElevenLabs `optimizeStreamingLatency=4`)

---

### Acknowledgement

HN++ will not run forever — every Listen, every Pod, every Bot turn costs real ElevenLabs / Gemini / Firecrawl credits. If you've been using it and want it to stay alive past the hackathon, consider buying me a coffee — the link is in the sidebar, in the landing footer, and at the bottom of the README.

---

## v0.1.0 — 2026-05-04

First public release. Built for the ElevenHacks hackathon.

---

### Features

**Listen** — per-article AI narration
- Firecrawl scrapes article content; Gemini Flash writes a 180–220 word audiobook-style summary incorporating comment sentiment; ElevenLabs Flash v2.5 streams it back as MP3
- Sub-3s to first audio byte via `optimizeStreamingLatency=4`
- Graceful fallback to title + comments when scrape fails (paywall, timeout)
- Render cache keyed on story + model + voice — no double-billing
- Listen pill shows solid fill + animated EQ bars while playing
- Job items now narrated (previously skipped)

**HN++ Pod** — daily multi-voice podcast
- Pre-baked once a day at 6:30 AM PDT via GitHub Actions cron
- 8 top stories scraped → Gemini Flash builds structured `{intro, segments[], outro}` dialogue → ElevenLabs `text-to-dialogue` (`eleven_v3`) renders host + rotating guest into ~5 min MP3
- Audio player: waveform with playhead, past-bar shading, chapter pips, draggable seek thumb
- Episode header: topic-forward layout, host/guest panel with active-speaker highlight
- Chapter strip with ticks and halo on current chapter
- Last 7 episodes kept; manifest served via `/api/podcast/today` + `/api/podcast/archive`

**HN++ Bot** — live conversational AI agent
- ElevenLabs Conversational AI with signed-URL flow (API key stays server-side)
- 7 tools: 3 client-side (`set_searching_state`, `show_sources`, `open_story`) + 4 webhook (Algolia feed/search/thread, Firecrawl scrape)
- Orb with 4 states: idle → listening → searching → speaking
- Citations rail showing HN source cards (score, comments) + external article cards
- BETA badge in header

**Voice Search (STT)** — mic input on all three pages
- Records up to 4.5s via `MediaRecorder`, sends to `/api/stt` (ElevenLabs Scribe v1), auto-submits search query

**Past Feed** — browse any prior day
- Algolia query by date window re-ranked locally with HN's gravity formula `(points-1)/(age_h+2)^1.8`
- Tooltip clarifies approximate vs. official ranking

**Feed & Highlights**
- Login modal with localStorage persistence and UserChip in header
- Story grid expanded from 3 → 5 columns on highlights
- Category chips with topic-color dots
- Comment depth rails, avatar tiles, OP badge
- Metadata as dot-separated chain
- Upvote committed state with halo
- Section header with live pulse dot + story count + accent underline
- Story card title typographic weight pass

---

### UI & Design

- Glassmorphic card system with frosted-glass headers across all three pages
- Page transition: 36px blur overlay, 340ms fade between routes
- Warm SF palette — `#f6f0e8` light / `#1c1710` dark, orange accent `#ff6600`
- Syne display font + Inter body + JetBrains Mono for code/meta
- Dark mode across all pages and components
- Podcast exchange rails replacing tinted-box layout
- "Powered by ElevenLabs" badge recolored from violet to accent orange

---

### Infrastructure

- Next.js App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui
- SWR for all client data fetching (feed, podcast manifest, archive)
- Zod validation at all API route boundaries
- Vercel deployment with `@vercel/analytics` + `@vercel/speed-insights`
- GitHub Actions cron for daily podcast generation
- Podcast store filesystem-backed, R2-swap-ready
- `.podcast-store/` gitignored — episodes never re-generated unless missing
