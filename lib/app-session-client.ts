const APP_SESSION_KEY = 'iperocks_app_session';

export function getAppSessionToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(APP_SESSION_KEY);
}

export function setAppSessionToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(APP_SESSION_KEY, token);
}

export function clearAppSessionToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(APP_SESSION_KEY);
}
