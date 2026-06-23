'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  finishOAuthFromUrl,
  getNextFromUrl,
  isOAuthCallbackUrl,
  isOAuthHandled,
  markOAuthHandled,
  redirectAuthenticatedUser,
  clearStaleOAuthFlags,
  clearOAuthFlags,
} from '@/lib/auth/oauth';
import { readStoredAuthUser } from '@/lib/supabase/session-fast';

export function OAuthListener() {
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    clearStaleOAuthFlags();

    const handleExistingSession = (url: string) => {
      markOAuthHandled();
      clearOAuthFlags();
      void redirectAuthenticatedUser(getNextFromUrl(url));
    };

    const handleUrl = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;
      if (handledUrlRef.current === url) return;

      if (readStoredAuthUser()) {
        handleExistingSession(url);
        return;
      }

      if (isOAuthHandled()) return;

      handledUrlRef.current = url;
      console.warn('[oauth] processing callback URL');

      try {
        await Browser.close();
      } catch {
        // Browser may already be closed after deep link handoff.
      }

      try {
        await finishOAuthFromUrl(url);
        markOAuthHandled();
      } catch (error) {
        console.error('[oauth] native callback failed:', error);
        if (readStoredAuthUser()) {
          handleExistingSession(url);
          return;
        }
        const redirected = await redirectAuthenticatedUser(getNextFromUrl(url));
        if (redirected) {
          markOAuthHandled();
        }
      }
    };

    void App.getLaunchUrl().then(async (result) => {
      if (!result?.url || !isOAuthCallbackUrl(result.url)) return;

      if (readStoredAuthUser()) {
        handleExistingSession(result.url);
        return;
      }

      if (isOAuthHandled()) return;

      await handleUrl(result.url);
    });

    const urlListener = App.addListener('appUrlOpen', (event) => {
      void handleUrl(event.url);
    });

    return () => {
      void urlListener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
