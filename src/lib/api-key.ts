const STORAGE_KEY = 'reddit_ads_gemini_api_key';
const CHANGE_EVENT = 'reddit-ads:api-key-changed';

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  const trimmed = key.trim();
  try {
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage disabled (private mode, quota full). Key won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearApiKey(): void {
  setApiKey('');
}

export function hasApiKey(): boolean {
  const key = getApiKey();
  return !!key && key.length > 0;
}

export function subscribeApiKey(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('Gemini API key is not set. Please add your key in the setup screen.');
    this.name = 'MissingApiKeyError';
  }
}
