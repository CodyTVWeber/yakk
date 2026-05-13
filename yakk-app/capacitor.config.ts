import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yakk.app',
  appName: 'yakk-app',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'huggingface.co',
      '*.huggingface.co',
      'cas-bridge.xethub.hf.co'
    ]
  }
};

export default config;
