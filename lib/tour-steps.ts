export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type TourStep = {
  selector: string | null;
  title: string;
  body: string;
  placement?: TourPlacement;
  cta?: string;
  showSkip?: boolean;
};

export type TourState = {
  status: 'pending' | 'active' | 'completed' | 'dismissed';
  step: number;
};

export const TOUR_STORAGE_KEY = 'hnpp_tour';

export const LANDING_STEPS: TourStep[] = [
  {
    selector: '[data-tour="landing-cta"]',
    title: 'Welcome to HN++',
    body: "A complete Hacker News redesign — with a voice. Tap Try HN++ now to see it live.",
    placement: 'bottom',
    cta: "Take the tour →",
  },
];

export const HIGHLIGHTS_STEPS: TourStep[] = [
  {
    selector: 'nav.hnav',
    title: 'Three views',
    body: 'Highlights for the curated daily view, Feed for the firehose, Podcast for the daily ~5 min show.',
    placement: 'bottom',
    cta: 'Next',
  },
  {
    selector: 'button[data-tour="talk-bot"]',
    title: 'Talk to HN++ Bot',
    body: 'A live conversational AI agent. Ask what is trending, who is hiring, what the top thread is about — it answers in real time.',
    placement: 'bottom',
    cta: 'Next',
  },
  {
    selector: 'button.search-kbd',
    title: 'Search by voice',
    body: 'Tap the mic to dictate a search. ElevenLabs Scribe transcribes you instantly and filters stories.',
    placement: 'bottom',
    cta: 'Next',
  },
  {
    selector: '.audio-btn',
    title: 'Listen to any story',
    body: 'Tap Listen on any story for an AI narration in under three seconds — article + comment sentiment, streamed via ElevenLabs.',
    placement: 'bottom',
    cta: 'Next',
  },
  {
    selector: null,
    title: "You're set",
    body: 'HN++ runs on real ElevenLabs, Gemini, and Firecrawl credits. If you like it and want it to stay alive past the hackathon, the ko-fi link is in the sidebar.',
    placement: 'center',
    cta: 'Done',
    showSkip: false,
  },
];
