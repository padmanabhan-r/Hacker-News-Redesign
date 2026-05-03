'use client';
import { useEffect, useState } from 'react';

export function PageTransition() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 300);
    const t2 = setTimeout(() => setGone(true), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (gone) return null;

  return (
    <div className={`pt-overlay${fading ? ' pt-fading' : ''}`}>
      <div className="pt-mark">
        <div className="pt-ring" />
        <div className="pt-logo">
          Y
          <span className="pt-plus">++</span>
        </div>
      </div>
    </div>
  );
}
