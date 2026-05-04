# Changelog

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
