/**
 * Capacitor Configuration — Ma Sói Mobile (iOS & Android)
 * Target Bundle ID: com.masoi.online
 */

const config = {
  appId: 'com.masoi.online',
  appName: 'Ma Sói',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Ma Sói',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a12',
      showSpinner: false,
    },
  },
};

export default config;
