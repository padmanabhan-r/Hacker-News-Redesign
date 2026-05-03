import { CAST, HOSTS, type CastMember } from "./voice-cast";

export const HOST: CastMember = HOSTS.primary;

export const GUEST_POOL: CastMember[] = CAST.filter((c) => c.persona !== HOST.persona);

export function guestForDate(dateYmd: string): CastMember {
  const ms = Date.parse(`${dateYmd}T00:00:00Z`);
  if (!Number.isFinite(ms)) {
    return GUEST_POOL[0];
  }
  const dayIdx = Math.floor(ms / 86_400_000);
  const len = GUEST_POOL.length;
  const idx = ((dayIdx % len) + len) % len;
  return GUEST_POOL[idx];
}

export type PodcastVoices = { host: CastMember; guest: CastMember };

export function castForDate(dateYmd: string): PodcastVoices {
  return { host: HOST, guest: guestForDate(dateYmd) };
}
