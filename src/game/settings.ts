import { DEFAULT_SETTINGS, GameSettings } from '../types';

const STORAGE_KEY = 'pixel-bonkers-settings';

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('[settings] localStorage nicht verfuegbar', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* egal - Spiel darf darunter nicht leiden */
  }
}

export const settings = loadSettings();
