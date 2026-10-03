import { NativeBridge } from './nativeBridge';

const SOUND_STORAGE_KEY = 'masoi_sound_effects_enabled';

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!isSoundEnabled()) return;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Chuông gõ boong khi hết giờ hoặc chuyển lượt
   */
  playBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh huyền bí khi bắt đầu Đêm
   */
  playNightAmbiance() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 1.5);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh bình minh / sáng tươi
   */
  playDawnChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh xào bài (card shuffle flutter)
   */
  playShuffle() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const count = 6;
      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + i * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.04);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh lật / phát một lá bài
   */
  playCardDeal() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh Sói hú rùng rợn lúc nửa đêm (Procedural Werewolf Howl)
   */
  playWolfHowl() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const t = this.ctx.currentTime;

      // Đường cong tần số tiếng sói hú: Trầm -> Rít cao -> Trầm dần
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.8);
      osc.frequency.exponentialRampToValueAtTime(580, t + 1.4);
      osc.frequency.exponentialRampToValueAtTime(180, t + 2.4);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 2.4);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Âm thanh gà gáy rạng sáng / Bình minh buông xuống
   */
  playRoosterMorning() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [
        { freq: 440, time: 0, dur: 0.2 },
        { freq: 554, time: 0.25, dur: 0.2 },
        { freq: 659, time: 0.5, dur: 0.7 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + time);

        gain.gain.setValueAtTime(0.2, t + time);
        gain.gain.exponentialRampToValueAtTime(0.001, t + time + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + time);
        osc.stop(t + time + dur);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Tiếng gõ búa tòa án đanh thép khi Bỏ Phiếu
   */
  playCourtGavel() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      [0, 0.25].forEach((delay) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(140, t + delay);
        osc.frequency.exponentialRampToValueAtTime(40, t + delay + 0.12);

        gain.gain.setValueAtTime(0.4, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 0.12);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Tiếng chuông tử thần u tối khi có người bị xử tử
   */
  playDeathBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(196, this.ctx.currentTime); // G3 note
      osc.frequency.exponentialRampToValueAtTime(98, this.ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.0);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Tiếng gõ nhẹ khi bấm vote hoặc chọn biểu cảm
   */
  playVoteSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Haptic vibration feedback for mobile (Native Taptic Engine & Web fallback)
   */
  triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    NativeBridge.hapticImpact(type);
  }
}

export const soundEffects = new SoundManager();

export const playVoteSound = () => soundEffects.playVoteSound();
export const playWolfHowl = () => soundEffects.playWolfHowl();
export const playDeathBell = () => soundEffects.playDeathBell();
export const playDawnChime = () => soundEffects.playDawnChime();
export const playRoosterMorning = () => soundEffects.playRoosterMorning();
export const playCourtGavel = () => soundEffects.playCourtGavel();

