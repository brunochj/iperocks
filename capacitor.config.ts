import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ipe.rocks',
  appName: 'Iperocks',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
