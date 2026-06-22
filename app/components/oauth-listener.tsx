'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { finishOAuthFromUrl, isOAuthCallbackUrl } from '@/lib/auth/oauth';

export function OAuthListener() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;

      try {
        await Browser.close();
        await finishOAuthFromUrl(url);
      } catch (error) {
        console.error('[oauth] native callback failed:', error);
        window.location.href = '/login';
      }
    };

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        void handleUrl(result.url);
      }
    });

    const listener = App.addListener('appUrlOpen', (event) => {
      void handleUrl(event.url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
