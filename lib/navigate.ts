function normalizePath(path: string): string {
  if (typeof window === 'undefined') return path;
  const url = new URL(path, window.location.origin);
  return (
    url.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/'
  );
}

function currentPathname(): string {
  if (typeof window === 'undefined') return '/';
  return (
    window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') ||
    '/'
  );
}

/** Static export + Capacitor serves pages as `/route/index.html` — use trailing slashes. */
export function toAppPath(path: string): string {
  if (typeof window === 'undefined') return path;

  const url = new URL(path, window.location.origin);
  const hasFileExtension = /\.[a-z0-9]+$/i.test(url.pathname);

  if (
    url.pathname !== '/' &&
    !url.pathname.endsWith('/') &&
    !hasFileExtension
  ) {
    url.pathname = `${url.pathname}/`;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function isCurrentPath(path: string): boolean {
  if (typeof window === 'undefined') return false;
  return normalizePath(path) === currentPathname();
}

/** Full-page navigation — required for static export inside Capacitor. */
export function navigateTo(path: string) {
  if (typeof window === 'undefined') return;
  const target = toAppPath(path);
  if (isCurrentPath(target)) return;
  window.location.href = target;
}
