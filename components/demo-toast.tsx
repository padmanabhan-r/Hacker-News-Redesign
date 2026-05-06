'use client';

import { useEffect, useState } from 'react';

const EVENT = 'hnpp:demo-toast';

export function showDemoToast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function DemoToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    function onEvt(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setMsg(detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 3800);
    }
    window.addEventListener(EVENT, onEvt);
    return () => {
      window.removeEventListener(EVENT, onEvt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className="demo-toast" role="status" aria-live="polite">
      <span className="demo-toast-dot" />
      {msg}
    </div>
  );
}
