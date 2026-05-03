import { writeFileSync } from 'fs';
import { resolve } from 'path';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) { console.error('ELEVENLABS_API_KEY not set'); process.exit(1); }

const prompt = `Minimal ambient lofi instrumental for a tech news podcast background.
Subtle lo-fi hip hop groove, sparse piano chords, muted jazz guitar,
soft sub bass, light vinyl crackle. Silicon Valley startup vibe — focused,
calm, cerebral. No vocals. 90 BPM. Seamlessly loopable.`;

console.log('Generating background music via ElevenLabs music_v1…');

const res = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
  method: 'POST',
  headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt,
    model_id: 'music_v1',
    music_length_ms: 60000,
    force_instrumental: true,
  }),
});

if (!res.ok) {
  const err = await res.text();
  console.error('API error', res.status, err);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
const out = resolve('public/audio/bed.mp3');
writeFileSync(out, buf);
console.log(`Saved ${buf.length} bytes → ${out}`);
