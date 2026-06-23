'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { createClient } from '@/lib/supabase/client';
import {
  finishOAuthFromUrl,
  getNextFromUrl,
  isOAuthCallbackUrl,
  isOAuthHandled,
  markOAuthHandled,
  redirectAuthenticatedUser,
} from '@/lib/auth/oauth';

export function OAuthListener() {
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;
      if (handledUrlRef.current === url) return;

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isOAuthHandled() && session) {
        return;
      }

      handledUrlRef.current = url;
      console.log('[oauth] received callback URL:', url);

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
        const redirected = await redirectAuthenticatedUser(getNextFromUrl(url));
        if (redirected) {
          markOAuthHandled();
        }
      }
    };

    void App.getLaunchUrl().then(async (result) => {
      if (!result?.url) return;

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isOAuthHandled() && session) {
        return;
      }

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
