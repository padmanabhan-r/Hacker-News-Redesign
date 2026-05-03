// Procedural canvas thumbnail (client-only)
import { categorize, CAT_EMOJI, type HNItem } from "./hn";

const CAT_GRADIENTS: Record<string, [string, string]> = {
  AI: ["#1e1040", "#0f0b2d"],
  Security: ["#2d0f0f", "#1a0808"],
  Hardware: ["#0a2218", "#051510"],
  Startups: ["#0a1628", "#050f1e"],
  Engineering: ["#1a1200", "#100d00"],
  Science: ["#111428", "#0b0d1e"],
  Web: ["#001828", "#001018"],
  Business: ["#1e0f08", "#120a04"],
  Tech: ["#0e1020", "#0a0c18"],
};

const cache: Record<number, string> = {};

export function generateThumbnail(story: HNItem, width = 400, height = 220): string {
  if (typeof document === "undefined") return "";
  if (cache[story.id]) return cache[story.id];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cat = categorize(story.title || "");
  const g = CAT_GRADIENTS[cat.label] || CAT_GRADIENTS.Tech;

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, g[0]);
  bg.addColorStop(0.5, g[1]);
  bg.addColorStop(1, "#060810");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const seed = (story.id || 1) * 9301 + 49297;
  const rand = (n: number) => ((seed * n * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 60; i++) {
    const x = rand(i * 3 + 1) * width;
    const y = rand(i * 3 + 2) * height;
    const r = rand(i * 3 + 3) * 2.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${rand(i) * 0.12 + 0.02})`;
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(width * 0.3, height * 0.35, 0, width * 0.3, height * 0.35, width * 0.6);
  glow.addColorStop(0, cat.color + "28");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.75, height * 0.7, 0, width * 0.75, height * 0.7, width * 0.4);
  glow2.addColorStop(0, cat.color + "18");
  glow2.addColorStop(1, "transparent");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  const emoji = CAT_EMOJI[cat.label] || "💡";
  ctx.font = `${Math.min(width, height) * 0.28}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.18;
  ctx.fillText(emoji, width * 0.5, height * 0.5);
  ctx.globalAlpha = 1;

  const overlay = ctx.createLinearGradient(0, height * 0.5, 0, height);
  overlay.addColorStop(0, "transparent");
  overlay.addColorStop(1, "rgba(6,8,16,0.7)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, width, height);

  const url = canvas.toDataURL("image/jpeg", 0.85);
  cache[story.id] = url;
  return url;
}
