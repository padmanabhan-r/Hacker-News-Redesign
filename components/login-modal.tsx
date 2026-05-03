'use client';

import { useState } from 'react';

export interface HNUser {
  username: string;
  joinedAt: number;
}

const STORAGE_KEY = 'hn_user';

export function getStoredUser(): HNUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(u: HNUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function LoginModal({ onLogin, onClose }: { onLogin: (u: HNUser) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const u: HNUser = { username: n, joinedAt: Date.now() };
    saveUser(u);
    onLogin(u);
  }
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Join Hacker News</h2>
        <p className="modal-sub">Choose a username to log in. No password or email needed.</p>
        <form onSubmit={submit}>
          <div className="modal-label">Username</div>
          <input
            className="modal-input"
            placeholder="e.g. paul_graham"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={24}
          />
          <button type="submit" className="modal-cta">Enter Hacker News →</button>
        </form>
        <div className="modal-hint">Stored locally in your browser. No account created.</div>
      </div>
    </div>
  );
}

export function UserChip({ user, onLogout }: { user: HNUser; onLogout: () => void }) {
  return (
    <div className="user-chip" onClick={onLogout} title="Click to log out">
      <div className="user-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
      <span className="user-name">{user.username}</span>
    </div>
  );
}
