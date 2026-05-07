# Changelog

## v1 — "HN++ Beta" — 2026-05-07

First Beta. All three audio products (Listen, HN++ Pod, HN++ Bot) live in production, glassmorphic redesign shipped, daily cron baking episodes to Cloudflare R2, conversational agent wired to public Algolia + Firecrawl with no self-hosted webhook layer. Desktop-first — mobile layout not tuned yet.

**Changes since v0.3.0**

- **Podcast archive extended 7 → 14 days** (`8e17eed`). `app/api/podcast/archive/route.ts` now returns the last 14 manifests; podcast-shell archive list shows the same window.
- **STT locked to English** (`95f7e13`). `/api/stt` now sends `languageCode: "en"` to ElevenLabs Scribe — stops occasional auto-detect drift on accented English queries.
- **Tour spotlight clamped to viewport** (`95f7e13`). `components/tour.tsx` `getBoundingClientRect` results clamped before mask/ring math, so spotlight no longer overflows offscreen on edge cards.
- **Tour final step trimmed** (`5100188`). Last step copy simplified, ko-fi mention dropped from the tour itself (still in sidebar + landing footer).
- **Button visibility pass** (`cfbb2fb`). Active nav tabs now solid accent (was translucent); `.listen-btn` gets a visible border in both themes.
- **Feed icon refresh** (`02706dc`).
- **README tightened** (`4d5a4b1`). Categories list corrected, cron timezone normalised to `01:30 UTC (07:00 IST)`, dead `PODCAST_STORE_DIR` env var removed, Desktop-first note added, support blurb softened.

**Carried into Beta from v0.2.0 / v0.3.0**

- Cloudflare R2 podcast store (`podcast/{date}.mp3` + `.json` + `.script.json` + `index.json`)
- First-run guided tour (`components/tour.tsx`, persisted via `localStorage.hnpp_tour`)
- ko-fi support button (sidebar + landing-footer variants)
- Read-only demo toast on upvote/reply

---

## v0.3.0 — "Spotlight" — 2026-05-06

First-time visitors get a guided tour. Two stops: one on the landing page nudging them toward "Try HN++ now", four+finale on `/highlights` walking through the nav tabs, the HN++ Bot, voice search, and per-story Listen.

**How it works**
- New `components/tour.tsx` — single client component that owns state, `getBoundingClientRect` measurement, a 4-rect spotlight mask + accent ring, and a glassmorphic bubble with step counter, Skip, and Next/Done buttons. Bubble auto-flips placement when a side runs out of viewport room.
- New `lib/tour-steps.ts` — typed step definitions (`LANDING_STEPS`, `HIGHLIGHTS_STEPS`).
- Persistence via `localStorage.hnpp_tour` (`{ status, step }`). State survives the landing → highlights route change. Status transitions: `pending → active → completed | dismissed`. Once `completed` or `dismissed`, the tour never re-shows.
- Resilience: each step uses `waitForElement(selector, 2000ms)` so SWR-loaded content (story cards) does not race the tour. Missed targets skip silently.
- Esc dismisses; Skip dismisses; Done completes.
- Z-index 499 (mask + ring) / 501 (bubble) — sits below `.modal-overlay` (500) so a real LoginModal can interrupt cleanly.

**Wiring**
- `app/page.tsx` — `data-tour="landing-hero-cta"` on the hero CTA, `<Tour route="landing" />` mounted near `</footer>`.
- `components/highlights-shell.tsx` — `<Tour route="highlights" />` mounted at the shell root. Step selectors target existing classes (`nav.hnav`, `button.search-kbd`, `.hero-card .listen-overlay`) so no markup churn there.
- `components/talk-bot-button.tsx` — `data-tour="talk-bot"` added to the rendered button.
- `app/globals.css` — `.tour-mask`, `.tour-ring` (pulsing accent halo), `.tour-bubble`, `.tour-step-counter`, `.tour-bubble-title`, `.tour-bubble-body`, `.tour-skip`, `.tour-next`.

**Reset for testing**
```js
localStorage.removeItem('hnpp_tour');
```

---

## v0.2.1 — 2026-05-06

- Read-only demo notice on upvote/reply. Story-card upvote, comment upvote, and comment reply buttons now surface a top-center accent toast: "HN++ is read-only — actions don't sync to Hacker News." Mounted via new `components/demo-toast.tsx`, dispatched through a custom event, 3.8s auto-dismiss.

---

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
