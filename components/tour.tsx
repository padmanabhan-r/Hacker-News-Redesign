'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HIGHLIGHTS_STEPS,
  LANDING_STEPS,
  TOUR_STORAGE_KEY,
  type TourPlacement,
  type TourState,
  type TourStep,
} from '@/lib/tour-steps';

type Route = 'landing' | 'highlights';

const BUBBLE_W = 320;
const BUBBLE_GAP = 14;
const VIEWPORT_PAD = 12;

function getStored(): TourState {
  if (typeof window === 'undefined') return { status: 'pending', step: 0 };
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return { status: 'pending', step: 0 };
    const parsed = JSON.parse(raw) as TourState;
    if (!parsed?.status) return { status: 'pending', step: 0 };
    return parsed;
  } catch {
    return { status: 'pending', step: 0 };
  }
}

function saveStored(s: TourState) {
  try { localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

function waitForElement(selector: string, timeoutMs = 2000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el) return resolve(el);
      if (performance.now() - start > timeoutMs) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

type Rect = { top: number; left: number; width: number; height: number };

function computeBubblePos(rect: Rect | null, placement: TourPlacement, vw: number, vh: number) {
  if (!rect || placement === 'center') {
    return {
      top: Math.max(VIEWPORT_PAD, vh / 2 - 100),
      left: Math.max(VIEWPORT_PAD, (vw - BUBBLE_W) / 2),
      arrow: 'none' as const,
    };
  }

  const candidates: Array<{ side: TourPlacement; top: number; left: number; fits: boolean }> = [];

  // bottom
  candidates.push({
    side: 'bottom',
    top: rect.top + rect.height + BUBBLE_GAP,
    left: rect.left + rect.width / 2 - BUBBLE_W / 2,
    fits: rect.top + rect.height + BUBBLE_GAP + 160 < vh - VIEWPORT_PAD,
  });
  // top
  candidates.push({
    side: 'top',
    top: rect.top - 160 - BUBBLE_GAP,
    left: rect.left + rect.width / 2 - BUBBLE_W / 2,
    fits: rect.top - 160 - BUBBLE_GAP > VIEWPORT_PAD,
  });
  // right
  candidates.push({
    side: 'right',
    top: rect.top + rect.height / 2 - 80,
    left: rect.left + rect.width + BUBBLE_GAP,
    fits: rect.left + rect.width + BUBBLE_GAP + BUBBLE_W < vw - VIEWPORT_PAD,
  });
  // left
  candidates.push({
    side: 'left',
    top: rect.top + rect.height / 2 - 80,
    left: rect.left - BUBBLE_W - BUBBLE_GAP,
    fits: rect.left - BUBBLE_W - BUBBLE_GAP > VIEWPORT_PAD,
  });

  // Prefer requested placement; fall back to first that fits; finally first.
  const preferred = candidates.find((c) => c.side === placement && c.fits);
  const anyFits = candidates.find((c) => c.fits);
  const pick = preferred ?? anyFits ?? candidates[0];

  // Clamp into viewport
  const top = Math.min(Math.max(VIEWPORT_PAD, pick.top), vh - 160 - VIEWPORT_PAD);
  const left = Math.min(Math.max(VIEWPORT_PAD, pick.left), vw - BUBBLE_W - VIEWPORT_PAD);

  return { top, left, arrow: pick.side };
}

export function Tour({ route }: { route: Route }) {
  const steps = route === 'landing' ? LANDING_STEPS : HIGHLIGHTS_STEPS;
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const cancelledRef = useRef(false);

  const current: TourStep | null = active ? steps[stepIdx] ?? null : null;

  // Decide whether to start the tour for this route
  useEffect(() => {
    cancelledRef.current = false;
    const s = getStored();
    if (s.status === 'completed' || s.status === 'dismissed') return;

    if (route === 'landing') {
      if (s.status === 'pending') {
        setStepIdx(0);
        setActive(true);
      }
    } else if (route === 'highlights') {
      if (s.status === 'active') {
        setStepIdx(Math.min(s.step, HIGHLIGHTS_STEPS.length - 1));
        setActive(true);
      }
    }

    return () => { cancelledRef.current = true; };
  }, [route]);

  // Track viewport size
  useEffect(() => {
    if (!active) return;
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  // Resolve target rect for current step
  useEffect(() => {
    if (!active || !current) return;
    let raf = 0;
    let stop = false;

    if (!current.selector) {
      setRect(null);
      return;
    }

    let cleanup: (() => void) | null = null;

    waitForElement(current.selector).then((el) => {
      if (stop || cancelledRef.current) return;
      if (!el) {
        // Skip step on miss
        advance();
        return;
      }
      // Center target in its scroll ancestor (which may not be window — e.g. .page-body).
      const r0 = el.getBoundingClientRect();
      const vhNow = window.innerHeight;
      if (r0.top < 90 || r0.top > vhNow * 0.55 || r0.bottom > vhNow - 200) {
        try {
          el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
        } catch {
          el.scrollIntoView();
        }
      }
      const measure = () => {
        if (stop) return;
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        raf = requestAnimationFrame(measure);
      };
      measure();

      // Landing: save state when user clicks the spotlit CTA (which already navigates).
      if (route === 'landing') {
        const onClick = () => saveStored({ status: 'active', step: 0 });
        el.addEventListener('click', onClick);
        cleanup = () => el.removeEventListener('click', onClick);
      }
    });

    return () => {
      stop = true;
      if (raf) cancelAnimationFrame(raf);
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx, current?.selector]);

  // Esc to dismiss
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const dismiss = useCallback(() => {
    saveStored({ status: 'dismissed', step: 0 });
    setActive(false);
  }, []);

  const complete = useCallback(() => {
    saveStored({ status: 'completed', step: 0 });
    setActive(false);
  }, []);

  const advance = useCallback(() => {
    if (route === 'landing') {
      saveStored({ status: 'active', step: 0 });
      setActive(false);
      router.push('/highlights');
      return;
    }
    setStepIdx((i) => {
      const next = i + 1;
      if (next >= steps.length) {
        saveStored({ status: 'completed', step: 0 });
        setActive(false);
        return i;
      }
      saveStored({ status: 'active', step: next });
      return next;
    });
  }, [route, steps.length, router]);

  if (!active || !current) return null;

  const pos = computeBubblePos(rect, current.placement ?? 'bottom', vw || 1, vh || 1);
  const stepNumber = stepIdx + 1;
  const total = steps.length;
  const showSkip = current.showSkip !== false;
  const isLastHighlights = route === 'highlights' && stepIdx === steps.length - 1;
  const isLandingCTAStep = route === 'landing';

  return (
    <>
      {/* Spotlight: 4 dark rects around the target, all clamped to viewport */}
      {rect && vw && vh ? (() => {
        const tt = Math.max(0, Math.min(vh, rect.top - 6));
        const bb = Math.max(0, Math.min(vh, rect.top + rect.height + 6));
        const ll = Math.max(0, Math.min(vw, rect.left - 6));
        const rr = Math.max(0, Math.min(vw, rect.left + rect.width + 6));
        const ringVisible = tt < bb && ll < rr;
        return (
          <>
            <div className="tour-mask" style={{ top: 0, left: 0, width: vw, height: tt }} />
            <div className="tour-mask" style={{ top: bb, left: 0, width: vw, height: Math.max(0, vh - bb) }} />
            <div className="tour-mask" style={{ top: tt, left: 0, width: ll, height: Math.max(0, bb - tt) }} />
            <div className="tour-mask" style={{ top: tt, left: rr, width: Math.max(0, vw - rr), height: Math.max(0, bb - tt) }} />
            {ringVisible ? (
              <div className="tour-ring" style={{ top: tt, left: ll, width: rr - ll, height: bb - tt }} />
            ) : null}
          </>
        );
      })() : (
        <div className="tour-mask tour-mask-full" />
      )}

      <div
        className="tour-bubble"
        role="dialog"
        aria-live="polite"
        style={{ top: pos.top, left: pos.left, width: BUBBLE_W }}
      >
        <div className="tour-step-counter">
          <span className="tour-pulse" />
          {isLandingCTAStep ? 'Welcome' : `Step ${stepNumber} of ${total}`}
        </div>
        <div className="tour-bubble-title">{current.title}</div>
        <div className="tour-bubble-body">{current.body}</div>
        <div className="tour-bubble-actions">
          {showSkip && !isLastHighlights && (
            <button type="button" className="tour-skip" onClick={dismiss}>Skip</button>
          )}
          <button
            type="button"
            className="tour-next"
            onClick={isLastHighlights ? complete : advance}
          >
            {current.cta ?? (isLastHighlights ? 'Done' : 'Next')}
          </button>
        </div>
      </div>
    </>
  );
}
