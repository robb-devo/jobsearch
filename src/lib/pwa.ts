import { useSyncExternalStore } from 'react';
import { isNativeApp } from './native';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

/** Registers the service worker (offline support) and keeps the browser's install prompt for our own button. */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol === 'https:' && !isNativeApp()) {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  }
}

export function useInstallPrompt(): (() => Promise<void>) | null {
  const event = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => deferred,
  );
  if (!event) return null;
  return async () => {
    await event.prompt();
    deferred = null;
    notify();
  };
}
