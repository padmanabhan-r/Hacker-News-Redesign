'use client';

import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export function ConvAgent() {
  const [active, setActive] = useState(false);
  const [convo, setConvo] = useState<{ end: () => Promise<void> } | null>(null);

  async function toggle() {
    if (active) {
      await convo?.end();
      setConvo(null);
      setActive(false);
      return;
    }
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      console.warn('NEXT_PUBLIC_ELEVENLABS_AGENT_ID not set — voice agent disabled');
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { Conversation } = await import('@elevenlabs/client');
      const c = await Conversation.startSession({
        agentId,
        onConnect: () => setActive(true),
        onDisconnect: () => setActive(false),
        onError: (e) => console.error('agent error', e),
      });
      setConvo(c as any);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? 'Stop voice agent' : 'Start voice agent'}
      className={`icon-btn ${active ? 'recording' : ''}`}
      title="Voice browse HN"
    >
      {active ? <MicOff size={14} /> : <Mic size={14} />}
    </button>
  );
}
