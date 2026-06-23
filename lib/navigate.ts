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

/**
 * Static export + Capacitor: navigate using explicit /route/index.html paths.
 * Trailing-slash directory URLs (/login/) are not reliably served by the
 * Capacitor Android WebViewAssetLoader; using the explicit file avoids the
 * SPA-fallback-to-root loop.
 */
export function toAppPath(path: string): string {
  if (typeof window === 'undefined') return path;

  const url = new URL(path, window.location.origin);
  const hasFileExtension = /\.[a-z0-9]+$/i.test(url.pathname);

  if (url.pathname === '/') {
    return `/${url.search}${url.hash}`;
  }

  if (!hasFileExtension) {
    // Normalise to explicit index.html so Capacitor serves the right file
    const clean = url.pathname.replace(/\/$/, '');
    url.pathname = `${clean}/index.html`;
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
  console.warn('[navigate] →', target, '(from', window.location.pathname + ')');
  window.location.replace(target);
}
