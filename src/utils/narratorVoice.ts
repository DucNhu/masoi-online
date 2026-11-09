import { soundEffects } from './soundEffects';

export const VOICE_STORAGE_KEY = 'masoi_narrator_voice_enabled';

export type NarratorSoundIntro = 'night' | 'wolf' | 'dawn' | 'gavel' | 'bell';

export interface NarratorSpeakOptions {
  soundIntro?: NarratorSoundIntro;
  lang?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  cancelPrevious?: boolean;
}

/**
 * Kiểm tra trạng thái bật/tắt của Giọng Quản Trò AI từ LocalStorage (Mặc định: true)
 */
export function isVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(VOICE_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Lưu trạng thái bật/tắt của Giọng Quản Trò AI vào LocalStorage
 */
export function setVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

/**
 * Làm sạch văn bản trước khi đưa vào bộ tổng hợp giọng nói:
 * - Loại bỏ các chỉ dẫn trong ngoặc vuông dành cho Quản trò (VD: [chỉ tay], [Quản trò tới vỗ vai...])
 * - Loại bỏ emoji và ký tự biểu tượng đồ họa
 * - Loại bỏ các ký tự định dạng thừa
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\[.*?\]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\uFE00-\uFE0F]/g, '')
    .replace(/["“”_#*~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export class NarratorVoiceService {
  private voices: SpeechSynthesisVoice[] = [];
  private pitch: number = 0.85; // Giọng trầm, ma mị
  private rate: number = 0.9;   // Từ tốn, kịch tính
  private volume: number = 1.0;
  private currentLang: string = 'vi-VN';
  private currentSubtitle: string | null = null;
  private subtitleListeners = new Set<(subtitle: string | null) => void>();
  private enabledListeners = new Set<(enabled: boolean) => void>();

  constructor() {
    this.initVoices();
  }

  /**
   * Khởi tạo và lắng nghe danh sách giọng của trình duyệt
   */
  private initVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      this.voices = window.speechSynthesis.getVoices();
    } catch {
      this.voices = [];
    }

    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        try {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.voices = window.speechSynthesis.getVoices();
          }
        } catch {
          // ignore
        }
      };
    } else if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        try {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.voices = window.speechSynthesis.getVoices();
          }
        } catch {
          // ignore
        }
      });
    }
  }

  /**
   * Trả về danh sách giọng nói hỗ trợ của hệ thống
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        this.voices = window.speechSynthesis.getVoices();
      } catch {
        this.voices = [];
      }
    }
    return this.voices;
  }

  isVoiceEnabled(): boolean {
    return isVoiceEnabled();
  }

  setVoiceEnabled(enabled: boolean): void {
    setVoiceEnabled(enabled);
    if (!enabled) {
      this.stop();
    }
    this.notifyEnabledListeners(enabled);
  }

  setPitch(p: number): void {
    this.pitch = Math.max(0.1, Math.min(2.0, p));
  }

  getPitch(): number {
    return this.pitch;
  }

  setRate(r: number): void {
    this.rate = Math.max(0.1, Math.min(2.0, r));
  }

  getRate(): number {
    return this.rate;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0.0, Math.min(1.0, v));
  }

  getVolume(): number {
    return this.volume;
  }

  setDefaultLang(lang: string): void {
    this.currentLang = lang;
  }

  getDefaultLang(): string {
    return this.currentLang;
  }

  /**
   * Tìm giọng đọc phù hợp nhất với ngôn ngữ chỉ định
   */
  findVoice(langCode: string = 'vi-VN'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    const normalizedTarget = langCode.toLowerCase().replace('_', '-');
    const targetPrefix = normalizedTarget.split('-')[0];

    // 1. Ưu tiên khớp chính xác mã ngôn ngữ (vd: 'vi-VN' hoặc 'en-US')
    let match = voices.find(
      (v) => v.lang && v.lang.toLowerCase().replace('_', '-') === normalizedTarget
    );
    if (match) return match;

    // 2. Khớp theo tiền tố ngôn ngữ (vd: 'vi' hoặc 'en')
    match = voices.find(
      (v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix)
    );
    if (match) return match;

    // 3. Nếu là tiếng Việt, ưu tiên giọng có chứa tên 'viet'
    if (targetPrefix === 'vi') {
      match = voices.find((v) => v.name && /viet/i.test(v.name));
      if (match) return match;
    }

    // 4. Giọng mặc định của hệ thống
    match = voices.find((v) => v.default);
    return match || voices[0] || null;
  }

  /**
   * Kiểm tra hệ thống có đang phát âm không
   */
  isSpeaking(): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    try {
      return Boolean(window.speechSynthesis.speaking);
    } catch {
      return false;
    }
  }

  /**
   * Dừng toàn bộ âm phát hiện tại và xóa phụ đề
   */
  stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.currentSubtitle = null;
    this.notifySubtitle(null);
  }

  getCurrentSubtitle(): string | null {
    return this.currentSubtitle;
  }

  /**
   * Đăng ký lắng nghe thay đổi nội dung phụ đề đang xướng
   */
  subscribeSubtitle(listener: (subtitle: string | null) => void): () => void {
    this.subtitleListeners.add(listener);
    try {
      listener(this.currentSubtitle);
    } catch {
      // ignore
    }
    return () => {
      this.subtitleListeners.delete(listener);
    };
  }

  private notifySubtitle(subtitle: string | null): void {
    this.currentSubtitle = subtitle;
    this.subtitleListeners.forEach((listener) => {
      try {
        listener(subtitle);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Đăng ký lắng nghe thay đổi trạng thái bật/tắt giọng đọc
   */
  subscribeEnabled(listener: (enabled: boolean) => void): () => void {
    this.enabledListeners.add(listener);
    try {
      listener(this.isVoiceEnabled());
    } catch {
      // ignore
    }
    return () => {
      this.enabledListeners.delete(listener);
    };
  }

  private notifyEnabledListeners(enabled: boolean): void {
    this.enabledListeners.forEach((listener) => {
      try {
        listener(enabled);
      } catch {
        // ignore
      }
    });
  }

  /**
   * Kích hoạt âm thanh dạo đầu tương ứng với bối cảnh
   */
  playIntroSound(soundIntro: NarratorSoundIntro): void {
    try {
      switch (soundIntro) {
        case 'night':
          soundEffects.playNightAmbiance();
          break;
        case 'wolf':
          soundEffects.playWolfHowl();
          break;
        case 'dawn':
          soundEffects.playDawnChime();
          break;
        case 'gavel':
          soundEffects.playCourtGavel();
          break;
        case 'bell':
          soundEffects.playDeathBell();
          break;
      }
    } catch (e) {
      console.warn('Narrator intro sound play failed:', e);
    }
  }

  /**
   * Phát biểu lời xướng Quản trò bằng Web Speech API
   */
  async speak(text: string, options?: NarratorSpeakOptions): Promise<boolean> {
    if (!this.isVoiceEnabled()) return false;
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return false;

    if (options?.cancelPrevious !== false) {
      this.stop();
    }

    if (options?.soundIntro) {
      this.playIntroSound(options.soundIntro);
    }

    return new Promise<boolean>((resolve) => {
      try {
        const UtteranceConstructor =
          typeof SpeechSynthesisUtterance !== 'undefined'
            ? SpeechSynthesisUtterance
            : (window as unknown as { SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance })
                ?.SpeechSynthesisUtterance;

        if (!UtteranceConstructor) {
          resolve(false);
          return;
        }

        const utterance = new UtteranceConstructor(cleanedText);
        const lang = options?.lang || this.currentLang;
        const voice = this.findVoice(lang);

        if (voice) {
          utterance.voice = voice;
        }
        utterance.lang = lang;
        utterance.pitch = options?.pitch ?? this.pitch;
        utterance.rate = options?.rate ?? this.rate;
        utterance.volume = options?.volume ?? this.volume;

        utterance.onstart = () => {
          this.notifySubtitle(cleanedText);
          try {
            options?.onStart?.();
          } catch {
            // ignore
          }
        };

        utterance.onend = () => {
          if (this.currentSubtitle === cleanedText) {
            this.notifySubtitle(null);
          }
          try {
            options?.onEnd?.();
          } catch {
            // ignore
          }
          resolve(true);
        };

        utterance.onerror = () => {
          if (this.currentSubtitle === cleanedText) {
            this.notifySubtitle(null);
          }
          try {
            options?.onEnd?.();
          } catch {
            // ignore
          }
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis speak invocation failed:', e);
        this.notifySubtitle(null);
        resolve(false);
      }
    });
  }
}

export const narratorVoice = new NarratorVoiceService();
