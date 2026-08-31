import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: ShortcutHandler;
}

const registeredShortcuts: Shortcut[] = [];

export function registerShortcut(shortcut: Shortcut) {
  const idx = registeredShortcuts.findIndex(
    (s) => s.key === shortcut.key && s.ctrl === shortcut.ctrl && s.shift === shortcut.shift && s.alt === shortcut.alt
  );
  if (idx >= 0) registeredShortcuts[idx] = shortcut;
  else registeredShortcuts.push(shortcut);
}

export function unregisterShortcut(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) {
  const idx = registeredShortcuts.findIndex(
    (s) => s.key === key && s.ctrl === ctrl && s.shift === shift && s.alt === alt
  );
  if (idx >= 0) registeredShortcuts.splice(idx, 1);
}

export function useKeyboardShortcuts() {
  const handler = useCallback((e: KeyboardEvent) => {
    const match = registeredShortcuts.find((s) => {
      if (s.key.toLowerCase() !== e.key.toLowerCase()) return false;
      if (s.ctrl && !e.ctrlKey) return false;
      if (s.shift && !e.shiftKey) return false;
      if (s.alt && !e.altKey) return false;
      if (!s.ctrl && e.ctrlKey) return false;
      return true;
    });
    if (match) {
      e.preventDefault();
      e.stopPropagation();
      match.handler();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handler]);

  return { registerShortcut, unregisterShortcut, registeredShortcuts };
}
