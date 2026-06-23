'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import { navigateTo, toAppPath } from '@/lib/navigate';

type AppLinkProps = ComponentProps<typeof Link>;

/** Avoid Next.js RSC prefetch — not available in static Capacitor builds. */
export default function AppLink({
  href,
  prefetch = false,
  onClick,
  ...props
}: AppLinkProps) {
  const hrefString =
    typeof href === 'string' ? href : href.pathname ?? '/';
  const staticHref = toAppPath(hrefString);

  if (Capacitor.isNativePlatform()) {
    return (
      <a
        {...props}
        href={staticHref}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          onClick?.(event as never);
          if (event.defaultPrevented) return;
          event.preventDefault();
          navigateTo(hrefString);
        }}
      />
    );
  }

  return <Link href={href} prefetch={prefetch} onClick={onClick} {...props} />;
}
