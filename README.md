# HN++ (A Hacker News Redesign)

**A complete Hacker News overhaul — redesigned, rethought, and now with a voice.**

> Built for ElevenHacks 2026 - not affiliated with Y Combinator.

[![App](https://img.shields.io/badge/Live-hn--plus--plus.vercel.app-brightgreen?style=flat-square&logo=googlechrome&logoColor=white)](https://hn-plus-plus.vercel.app)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS%20%2B%20Dialogue%20%2B%20STT%20%2B%20Agents%20%2B%20Music-FF6B35?style=flat-square&logoColor=white)](https://elevenlabs.io)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Firecrawl](https://img.shields.io/badge/Firecrawl-Article%20Scraping-E55F3B?style=flat-square&logoColor=white)](https://firecrawl.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15%20App%20Router-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-R2%20Storage-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Podcast%20Cron-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![ElevenHacks](https://img.shields.io/badge/Built%20for-ElevenHacks-FF6B35?style=flat-square&logoColor=white)](https://elevenlabs.io)

> Hacker News is one of the best places on the internet. But it's a wall of text.
>
> You can't listen to it on a commute. You can't ask it a question. There's no daily briefing. The content is great — the surface hasn't changed in 15 years.
>
> **HN++ changes that.**

**This is not a mockup. There is no demo data.**

Every story, score, comment, and ranking comes live from the official HN API. If it's on Hacker News right now, it's on HN++ right now — same content, same community, same firehose. The design is completely reinvented. Everything else stays exactly as it is.

On top of that: per-article AI narration, a fully automated daily podcast with a host and rotating guest, and a conversational bot that knows what's on HN right now. Same community. Same firehose. Now you can actually listen.

<!-- Screenshot: HN++ hero — replace with actual screenshot -->
<p align="center">
  <img src="images/hnpp-hero.png" alt="HN++ — Glassmorphic Hacker News with AI audio" width="700" />
</p>

---

## Table of Contents

- [What is HN++?](#what-is-hn)
- [UI Redesign](#ui-redesign)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Audio Pipelines](#audio-pipelines)
- [ElevenLabs Integration](#elevenlabs-integration)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Running Locally](#running-locally)
- [License](#license)

---

## What is HN++?

HN++ has three distinct products built on top of the official Hacker News API:

- **Highlights** — curated daily view of the top stories across 6 categories, with per-story Listen buttons.
- **Feed** — the full live HN firehose with voice search (ElevenLabs Scribe), Listen on every post, and collapsible comment threads.
- **HN++ Pod** — a fully automated daily podcast. Every morning a GitHub Actions cron scrapes the top 8 stories, Gemini Flash writes a multi-voice dialogue script, and ElevenLabs `eleven_v3` text-to-dialogue renders it as a ~5 min MP3 with chapter markers. Served from Cloudflare R2.
- **HN++ Bot** — a conversational AI agent (ElevenLabs Conversational AI) that knows what's on HN right now. Ask it anything: trending stories, who's hiring, what the community is debating.

---

## UI Redesign

HN++ is a complete visual redesign of Hacker News — same data, entirely different surface.

**Design language — glassmorphism on a warm SF palette.** Frosted-glass cards with backdrop blur, soft amber and orange tones, a warm late-afternoon light feel. Dense enough for power users who live in HN, calm enough for casual reading.

**Three views, each with a purpose:**
- **Highlights** — editorial-style card grid. Hero story large, 4 secondary stories, a headlines panel for the rest. Filtered by 6 categories (AI, Science, Business, Engineering, Ask HN, Show HN).
- **Feed** — the full firehose. Infinite scroll, per-story thumbnails, collapsible comment threads color-coded by depth, voice search.
- **Podcast** — a dedicated player UI with waveform visualiser, chapter scrubber, archive browser, and ambient music bed.

**Details:**
- Dark / light mode with smooth system-aware switching
- Frosted-glass page transition overlay on every route change
- Syne display font for headings, Inter for body, JetBrains Mono for code
- Responsive — works on mobile and desktop
- Scaffolded in [v0](https://v0.dev), then heavily customised

---

## How It Works

**1. Browse** — Open Highlights or Feed. Live data from the official HN API — same stories, same scores, same comments.

**2. Listen (per article)** — Tap the Listen button on any story. Firecrawl scrapes the linked article, Gemini Flash writes a 180–220-word narration blending article content with comment sentiment, ElevenLabs Flash v2.5 streams it back. First audio byte in under 3 seconds.

**3. Search by voice** — Tap the mic in the search bar on Feed or Highlights. ElevenLabs Scribe (`scribe_v1`) transcribes your query and filters stories instantly.

**4. Listen to the Pod** — Today's HN++ Pod is pre-baked every day at 1:30 AM GMT. Open the Podcast tab, hit play. Chapter markers let you skip to any story segment. Last 7 days are always available.

**5. Talk to the Bot** — Hit the HN++ Bot button. ElevenLabs Conversational AI connects. Ask what's trending, who's hiring, what the top thread is about — it answers in real time with live HN context.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Listen** | Tap any story for a 60–90s AI narration — article summary + comment sentiment, streamed via ElevenLabs Flash |
| **HN++ Pod** | Automated daily ~5 min multi-voice podcast — host Anchor Aiden + rotating guest |
| **Chapter Markers** | Skip directly to any of the 8 story segments in the podcast player |
| **Voice Search** | Tap the mic in the search bar — ElevenLabs Scribe transcribes your query live |
| **HN++ Bot** | Conversational AI agent with live HN context — ask anything |
| **Highlights View** | Curated top stories across 6 categories with a clean card grid |
| **Live HN Data** | Direct Firebase API — no cache lag, same ranking as hacker news |
| **Past** | Browse stories from any prior day. Note: HN's official API only exposes live `topstories`/`newstories`/`beststories`/etc., not historical front-page rankings. The Past feed queries Algolia for stories created in the day's window and re-ranks them locally with HN's gravity formula `(points-1)/(age_h+2)^1.8`, so order can drift slightly from `news.ycombinator.com/front?day=YYYY-MM-DD`. Mod actions, flags, and software penalties are not exposed by either public API. |
| **Glassmorphic UI** | Full HN redesign — frosted-glass cards, warm SF palette, Syne/Inter typography, dark/light mode, animated page transitions |

---

## Audio Pipelines

### Listen — per article, on demand

```
User taps Listen
  → POST /api/listen { storyId }
  → getStoryThread(storyId)                          // HN Firebase API
  → scrapeArticle(url, 4s timeout, markdown, fast)   // Firecrawl
  → summarizeForListen({ article, comments, story }) // Gemini Flash, thinkingLevel LOW
  → narrationToBuffer(summary)                       // ElevenLabs eleven_flash_v2_5
  → mp3 buffer streamed to <audio>, cached by story hash
```

Firecrawl failure (paywall/timeout) → Gemini falls back to title + comments only.
Target: ≤ 3s to first audio byte.

### HN++ Pod — daily multi-voice, pre-baked

```
GitHub Actions cron (01:30 UTC daily)
  → POST /api/podcast/cron  (Bearer auth)
  → idempotency check — skip if today's manifest exists
  → castForDate(date) → host: Anchor Aiden + rotating guest
  → getStoriesByFeed('top', 8) — 8 top stories
  → parallel scrapeArticles + getStoryThread (concurrency 5)
  → buildDialogueScript(stories, dateLabel, host, guest)
       Gemini Flash, thinkingLevel HIGH
       → { intro[], segments[8], outro[] }
  → renderDialogue(script, voices)
       chunk by sentence, ≤1900 chars per API call
       → eleven_v3 textToDialogue.convertWithTimestamps per chunk
       → concat MP3s, compute segment startMs/endMs
  → store mp3 + manifest to Cloudflare R2
  → manifest: { date, runtimeMs, storyTitles, host, guest, segments[] }
```

Listeners pull via `GET /api/podcast/today`, `/api/podcast/archive`, `/api/podcast/audio/{date}.mp3`.

### HN++ Bot — live conversational agent, no backend wrappers

```
User taps Talk to HN++ Bot (TalkBotButton)
  → BotPopup mounts ConversationProvider (@elevenlabs/react)
       clientTools = { set_searching_state, show_sources, open_story }
  → GET /api/agent/signed-url
       server-side: GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
       → returns short-lived wss URL (API key + agent ID never touch the browser)
  → conversation.startSession({ signedUrl, connectionType: 'websocket' })

ElevenAgents owns the loop: STT → gemini-2.5-flash → tools → eleven_flash_v2_5 TTS

7 tools (provisioned manually in the ElevenLabs console):
  Client tools (handled in components/bot-popup.tsx)
    - set_searching_state(label?)        → orb flips to SEARCHING
    - show_sources(query, sources)       → cards stream into right rail
    - open_story(storyId)                → opens HN thread in new tab

  Webhook tools (point at PUBLIC APIs — no self-hosted endpoints)
    - hn_feed          GET hn.algolia.com/api/v1/search?tags=front_page|ask_hn|show_hn|job
    - hn_search        GET hn.algolia.com/api/v1/search?query=...&tags=story
    - hn_story_thread  GET hn.algolia.com/api/v1/items/{storyId}
    - scrape_article   POST api.firecrawl.dev/v2/scrape (auth via console secret)

UI state machine (lib/bot-types.ts):
  idle → listening (onStatusChange:connected)
  listening → searching (set_searching_state)
  searching → speaking (onModeChange:speaking)
  speaking → listening (onModeChange:listening)
  any → idle (disconnect / End button)
```

Setup runbook: [`docs/AGENT_SETUP.md`](docs/AGENT_SETUP.md). System prompt: [`prompts/HN_BOT_SYSTEM_PROMPT.md`](prompts/HN_BOT_SYSTEM_PROMPT.md). Importable webhook tool configs: [`tools/*.json`](tools/).

---

## ElevenLabs Integration

Four ElevenLabs products are active in production:

| Product | Model / API | Where Used |
|---------|-------------|------------|
| **Flash TTS** (`eleven_flash_v2_5`) | `textToSpeech.convert` with `optimizeStreamingLatency=4` | Listen — per-article narration streamed on demand |
| **Text-to-Dialogue** (`eleven_v3`) | `textToDialogue.convertWithTimestamps` | HN++ Pod — multi-voice host/guest podcast, chapter timings |
| **Scribe STT** (`scribe_v1`) | `speechToText.convert` | Voice search in Feed + Highlights — mic input → query text |
| **Conversational AI** | `@elevenlabs/react` `ConversationProvider` + `useConversation`, signed-URL flow | HN++ Bot — real-time agent with live HN context, 7 tools wired in the ElevenLabs console (3 client + 4 webhook → public Algolia + Firecrawl APIs) |
| **Music API** | `music.compose` | Ambient music bed playing under the podcast player — generated once, baked as a static asset |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript strict |
| **Styling** | Tailwind CSS 4, shadcn/ui (new-york, neutral) |
| **TTS / Narration** | ElevenLabs `eleven_flash_v2_5` |
| **Dialogue / Podcast** | ElevenLabs `eleven_v3` text-to-dialogue |
| **STT / Voice Search** | ElevenLabs `scribe_v1` |
| **Conversational AI** | ElevenLabs Conversational AI (`@elevenlabs/react` browser SDK + signed-URL flow) |
| **AI Scripting** | Google Gemini Flash (`gemini-flash-latest`), tunable `thinkingLevel` |
| **Article Scraping** | Firecrawl (`@mendable/firecrawl-js`), markdown-only, fast mode |
| **HN Data** | Official HN Firebase API (live feeds) + Algolia (search, historical) |
| **Podcast Storage** | Cloudflare R2 (mp3 + manifest JSON) |
| **Cron** | GitHub Actions (`30 1 * * *` = 01:30 UTC = 7 AM IST) |
| **Data Fetching** | SWR |
| **Validation** | Zod (all API route boundaries) |
| **Package Manager** | pnpm |

---

## Screenshots

<!-- Replace these with actual screenshots -->

**Highlights — story grid**
<p align="center">
  <img src="images/hnpp-highlights.png" alt="HN++ Highlights — curated story grid with Listen buttons" width="700" />
</p>

**Feed — live HN with Listen**
<p align="center">
  <img src="images/hnpp-feed.png" alt="HN++ Feed — live Hacker News with per-story audio narration" width="700" />
</p>

**HN++ Pod — podcast player with chapters**
<p align="center">
  <img src="images/hnpp-podcast.png" alt="HN++ Pod — daily multi-voice podcast with chapter markers" width="700" />
</p>

**HN++ Bot — conversational AI**
<p align="center">
  <img src="images/hnpp-bot.png" alt="HN++ Bot — ElevenLabs Conversational AI with live HN context" width="700" />
</p>

**Landing page**
<p align="center">
  <img src="images/hnpp-landing.png" alt="HN++ Landing — glassmorphic Hacker News redesign" width="700" />
</p>

---

## Running Locally

**Prerequisites:** Node 20+, pnpm, API keys for ElevenLabs, Firecrawl, Gemini

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in your API keys (see below)

# Start dev server
pnpm dev
# or: ./start.sh  (kills :3000 first, then starts)
```

### Environment Variables

```env
# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...   # HN++ Bot (Conversational AI agent ID, server-only — used only inside /api/agent/signed-url)

# Google Gemini
GEMINI_API_KEY=...

# Firecrawl
FIRECRAWL_API_KEY=...

# Podcast cron (guards POST /api/podcast/cron)
CRON_SECRET=...

# Cloudflare R2 (optional — falls back to local filesystem)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=...

# Podcast store path (optional — defaults to ./.podcast-store)
PODCAST_STORE_DIR=...
```

### Setting up HN++ Bot

The bot agent is provisioned manually in the ElevenLabs console (no scripted creation). Full step-by-step runbook: [`docs/AGENT_SETUP.md`](docs/AGENT_SETUP.md).

Quick reference:
1. Console → **Create Agent** → paste system prompt from [`prompts/HN_BOT_SYSTEM_PROMPT.md`](prompts/HN_BOT_SYSTEM_PROMPT.md)
2. Add the 3 client tools (`set_searching_state`, `show_sources`, `open_story`) per Steps 1.3–1.5 of the runbook
3. Add the 4 webhook tools — either fill the form per Steps 1.6–1.10, or import the JSON files in [`tools/`](tools/) via the **Edit as JSON** button
4. Copy the agent ID into `ELEVENLABS_AGENT_ID`
5. Done. No tunnel, no self-hosted endpoints. Webhook tools hit public Algolia + Firecrawl directly

### Baking a podcast episode manually

```bash
# Bake today's episode (IST date)
pnpm tsx scripts/bake-episode.ts

# Bake a specific date
pnpm tsx scripts/bake-episode.ts --date 2026-05-04

# Force regenerate even if cached
pnpm tsx scripts/bake-episode.ts --force
```

> **Note:** The podcast cron is idempotent — it returns `{cached: true}` if today's episode already exists. Never call it with `--force` on a date that already has an MP3; it re-bills all three APIs.

### Other commands

```bash
pnpm build   # production build
pnpm lint    # eslint
```

---

## License

<p>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" />
  </a>
</p>

Licensed under the [MIT License](https://opensource.org/licenses/MIT).

Built by [Limb](https://x.com/__padmanabhan) for ElevenHacks 2026. Not affiliated with Y Combinator.

---

## Support

HN++ will be discontinued after the hackathon — but I really enjoyed building it, and see myself using it. If you do too and want to help cover the ElevenLabs credits to keep it alive, buy me a coffee:

<p>
  <a href="https://ko-fi.com/padmanabhan">
    <img src="https://img.shields.io/badge/Consider%20buying%20me%20a%20coffee-FF6600?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Consider buying me a coffee on Ko-fi" />
  </a>
</p>
