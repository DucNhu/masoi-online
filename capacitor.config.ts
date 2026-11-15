/**
 * Capacitor Configuration — Ma Sói Online & Werewolf 3D (iOS & Android Global)
 *
 * Store Readiness Specifications:
 * - Bundle ID (iOS) / Application ID (Android): com.masoi.online
 * - Apple App Store Primary Category: Games / Board
 * - Apple App Store Secondary Category: Games / Role Playing
 * - Google Play Category: GAME_BOARD / GAME_ROLE_PLAYING
 * - Content Rating: 12+ (Apple App Store) / Teen (Google Play Store)
 * - Supported Regions: Global (128+ Countries) & Vietnam
 */

export interface LocalizedStoreMeta {
  appName: string;
  subtitle: string;
  keywords: string[];
}

/**
 * Localized Display Names and Subtitles for Apple App Store Connect & Google Play Console
 */
export const STORE_DISPLAY_NAMES: Record<string, LocalizedStoreMeta> = {
  vi: {
    appName: 'Ma Sói Online',
    subtitle: 'Khu Cắm Trại 3D • Voice Chat • Ma Sói Thời Gian Thực',
    keywords: ['ma soi', 'ma soi online', 'werewolf 3d', 'board game', 'quan tro', 'ma soi tieng viet'],
  },
  default: {
    appName: 'Werewolf Online: 3D Campfire',
    subtitle: '3D Social Deduction • Simultaneous Night • Voice Chat',
    keywords: ['werewolf online', 'mafia game', 'social deduction', '3d werewolf', 'voice chat', 'party game'],
  },
  en: {
    appName: 'Werewolf Online: 3D Campfire',
    subtitle: '3D Social Deduction • Simultaneous Night • Voice Chat',
    keywords: ['werewolf online', 'mafia game', 'social deduction', '3d werewolf', 'voice chat', 'party game'],
  },
  ja: {
    appName: '人狼オンライン: 3Dキャンプファイア',
    subtitle: '3Dリアルタイム人狼・ボイスチャット・心理戦',
    keywords: ['人狼', '人狼ゲーム', '3D人狼', 'ボイスチャット', 'オンラインゲーム', '推理ゲーム'],
  },
  ko: {
    appName: '웨어울프 온라인: 3D 캠프파이어',
    subtitle: '3D 실시간 마피아・보이스 채팅・심리 추리 게임',
    keywords: ['마피아', '웨어울프', '3D 마피아', '보이스 채팅', '추리 게임'],
  },
  zh: {
    appName: '狼人杀3D: 篝火营地',
    subtitle: '3D实时狼人杀・实时语音・沉浸式推理',
    keywords: ['狼人杀', '3D狼人杀', '语音桌游', '社交推理'],
  },
  fr: {
    appName: 'Loups-Garous 3D: Feu de Camp',
    subtitle: 'Déduction Sociale 3D • Chat Vocal en Direct',
    keywords: ['loup garou', 'loups garous', 'jeu de deduction', 'chat vocal', 'multijoueur'],
  },
  es: {
    appName: 'Hombre Lobo 3D: Fogata Online',
    subtitle: 'Deducción Social 3D • Noche Simultánea • Chat de Voz',
    keywords: ['hombre lobo', 'juegos de mesa', 'deduccion social', 'chat de voz'],
  },
  de: {
    appName: 'Werwölfe 3D: Lagerfeuer Online',
    subtitle: '3D Social Deduction • Gleichzeitige Nacht • Sprach-Chat',
    keywords: ['werwölfe', 'werwolf online', 'social deduction', 'party spiel'],
  },
};

const config = {
  appId: 'com.masoi.online',
  appName: 'Ma Sói Online',
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
