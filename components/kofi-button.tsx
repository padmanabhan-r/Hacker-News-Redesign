'use client';

import { useState } from 'react';

type Variant = 'sidebar' | 'footer';

export function KofiButton({ variant = 'sidebar' }: { variant?: Variant }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          className="sb-kofi"
          onClick={() => setOpen(true)}
          title="Support HN++"
        >
          <img src="/logomarkLogo.webp" alt="" width={16} height={13} />
          <span>Buy me a coffee</span>
        </button>
      ) : (
        <button
          type="button"
          className="footer-link footer-kofi"
          onClick={() => setOpen(true)}
          title="Support HN++"
        >
          <img src="/logomarkLogo.webp" alt="" width={15} height={12} />
          <span>buy me a coffee</span>
        </button>
      )}

      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal-box kofi-modal">
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>×</button>
            <div className="kofi-modal-icon">
              <img src="/logomarkLogo.webp" alt="Ko-fi" width={70} height={56} />
            </div>
            <h2 className="modal-title">Enjoying HN++?</h2>
            <p className="modal-sub" style={{ lineHeight: 1.55 }}>
              This site will be discontinued after the hackathon. But I really enjoyed building it,
              and I see myself using it. If you like it too and want to help cover the
              ElevenLabs credits to keep it alive, consider buying me a coffee.
            </p>
            <a
              href="https://ko-fi.com/padmanabhan"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-cta kofi-cta"
              onClick={() => setOpen(false)}
            >
              Buy me a coffee →
            </a>
            <div className="modal-hint">Thanks for trying it out — Limb</div>
          </div>
        </div>
      )}
    </>
  );
}
