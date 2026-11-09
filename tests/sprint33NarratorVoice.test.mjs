import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Mock LocalStorage and Window for Node.js test environment
const mockStorage = new Map();
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };
}

class MockUtterance {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.lang = 'vi-VN';
    this.pitch = 1.0;
    this.rate = 1.0;
    this.volume = 1.0;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

const mockVoices = [
  { name: 'Google Tiếng Việt', lang: 'vi-VN', default: true },
  { name: 'Mai (Vietnamese)', lang: 'vi_VN', default: false },
  { name: 'Samantha (English)', lang: 'en-US', default: false },
  { name: 'Kyoko (Japanese)', lang: 'ja-JP', default: false },
];

let lastSpokenUtterance = null;
let cancelCalledCount = 0;

const mockSpeechSynthesis = {
  speaking: false,
  getVoices: () => mockVoices,
  speak: (utterance) => {
    lastSpokenUtterance = utterance;
    mockSpeechSynthesis.speaking = true;
    if (typeof utterance.onstart === 'function') {
      utterance.onstart();
    }
    setTimeout(() => {
      mockSpeechSynthesis.speaking = false;
      if (typeof utterance.onend === 'function') {
        utterance.onend();
      }
    }, 15);
  },
  cancel: () => {
    cancelCalledCount++;
    mockSpeechSynthesis.speaking = false;
    if (lastSpokenUtterance && typeof lastSpokenUtterance.onerror === 'function') {
      lastSpokenUtterance.onerror({ error: 'canceled' });
    }
  },
  onvoiceschanged: null,
};

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: globalThis.localStorage,
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: MockUtterance,
  };
} else {
  globalThis.window.localStorage = globalThis.localStorage;
  globalThis.window.speechSynthesis = mockSpeechSynthesis;
  globalThis.window.SpeechSynthesisUtterance = MockUtterance;
}
globalThis.SpeechSynthesisUtterance = MockUtterance;

// Import narratorVoice and utilities
import {
  narratorVoice,
  cleanTextForSpeech,
  isVoiceEnabled,
  setVoiceEnabled,
  VOICE_STORAGE_KEY,
} from '../src/utils/narratorVoice.ts';
import { soundEffects } from '../src/utils/soundEffects.ts';

test('Sprint 33: cleanTextForSpeech correctly strips emojis, brackets and special chars', () => {
  const raw1 = '🌙 Trời đã tối rồi, xin mời cả làng nhắm mắt lại và đi ngủ...';
  assert.equal(
    cleanTextForSpeech(raw1),
    'Trời đã tối rồi, xin mời cả làng nhắm mắt lại và đi ngủ...'
  );

  const raw2 = '💘 Thần Tình Yêu thức dậy! [Quản trò tới vỗ vai 2 người để họ nhận nhau]... Hãy chọn.';
  assert.equal(
    cleanTextForSpeech(raw2),
    'Thần Tình Yêu thức dậy! ... Hãy chọn.'
  );

  const raw3 = '🧪 Phù Thủy (Lá Q) thức dậy! Đêm nay người này bị cắn [chỉ tay]. Bạn có dùng Bình Cứu không?';
  assert.equal(
    cleanTextForSpeech(raw3),
    'Phù Thủy (Lá Q) thức dậy! Đêm nay người này bị cắn . Bạn có dùng Bình Cứu không?'
  );

  const raw4 = '⚖️ "Dân làng đã biểu quyết xử tử Sói!"';
  assert.equal(
    cleanTextForSpeech(raw4),
    'Dân làng đã biểu quyết xử tử Sói!'
  );
});

test('Sprint 33: Voice toggle & LocalStorage persistence', () => {
  setVoiceEnabled(true);
  assert.equal(isVoiceEnabled(), true);
  assert.equal(narratorVoice.isVoiceEnabled(), true);
  assert.equal(globalThis.localStorage.getItem(VOICE_STORAGE_KEY), 'true');

  setVoiceEnabled(false);
  assert.equal(isVoiceEnabled(), false);
  assert.equal(narratorVoice.isVoiceEnabled(), false);
  assert.equal(globalThis.localStorage.getItem(VOICE_STORAGE_KEY), 'false');

  narratorVoice.setVoiceEnabled(true);
  assert.equal(narratorVoice.isVoiceEnabled(), true);
  assert.equal(globalThis.localStorage.getItem(VOICE_STORAGE_KEY), 'true');
});

test('Sprint 33: Pitch, Rate and Volume configuration limits', () => {
  narratorVoice.setPitch(0.85);
  assert.equal(narratorVoice.getPitch(), 0.85);

  narratorVoice.setRate(0.9);
  assert.equal(narratorVoice.getRate(), 0.9);

  narratorVoice.setVolume(0.8);
  assert.equal(narratorVoice.getVolume(), 0.8);

  // Clamp checks
  narratorVoice.setPitch(5.0);
  assert.equal(narratorVoice.getPitch(), 2.0);

  narratorVoice.setRate(-1.0);
  assert.equal(narratorVoice.getRate(), 0.1);

  narratorVoice.setVolume(2.0);
  assert.equal(narratorVoice.getVolume(), 1.0);

  // Reset to default
  narratorVoice.setPitch(0.85);
  narratorVoice.setRate(0.9);
  narratorVoice.setVolume(1.0);
});

test('Sprint 33: Voice matching by language code (vi-VN, en-US, ja-JP)', () => {
  const viVoice = narratorVoice.findVoice('vi-VN');
  assert.ok(viVoice, 'Should find Vietnamese voice');
  assert.equal(viVoice.lang, 'vi-VN');

  const enVoice = narratorVoice.findVoice('en-US');
  assert.ok(enVoice, 'Should find English voice');
  assert.equal(enVoice.lang, 'en-US');

  const jaVoice = narratorVoice.findVoice('ja-JP');
  assert.ok(jaVoice, 'Should find Japanese voice');
  assert.equal(jaVoice.lang, 'ja-JP');
});

test('Sprint 33: soundIntro triggers appropriate atmospheric sound effects', async () => {
  const playedSounds = [];
  const origNight = soundEffects.playNightAmbiance;
  const origWolf = soundEffects.playWolfHowl;
  const origDawn = soundEffects.playDawnChime;
  const origGavel = soundEffects.playCourtGavel;
  const origBell = soundEffects.playDeathBell;

  soundEffects.playNightAmbiance = () => playedSounds.push('night');
  soundEffects.playWolfHowl = () => playedSounds.push('wolf');
  soundEffects.playDawnChime = () => playedSounds.push('dawn');
  soundEffects.playCourtGavel = () => playedSounds.push('gavel');
  soundEffects.playDeathBell = () => playedSounds.push('bell');

  narratorVoice.setVoiceEnabled(true);

  await narratorVoice.speak('Đêm đã buông xuống', { soundIntro: 'night' });
  assert.ok(playedSounds.includes('night'), 'Night sound effect played');

  await narratorVoice.speak('Ma Sói thức tỉnh', { soundIntro: 'wolf' });
  assert.ok(playedSounds.includes('wolf'), 'Wolf howl sound effect played');

  await narratorVoice.speak('Bình minh xuất hiện', { soundIntro: 'dawn' });
  assert.ok(playedSounds.includes('dawn'), 'Dawn chime sound effect played');

  await narratorVoice.speak('Gõ búa phán xét', { soundIntro: 'gavel' });
  assert.ok(playedSounds.includes('gavel'), 'Court gavel sound effect played');

  await narratorVoice.speak('Chuông tử thần reo', { soundIntro: 'bell' });
  assert.ok(playedSounds.includes('bell'), 'Death bell sound effect played');

  // Restore originals
  soundEffects.playNightAmbiance = origNight;
  soundEffects.playWolfHowl = origWolf;
  soundEffects.playDawnChime = origDawn;
  soundEffects.playCourtGavel = origGavel;
  soundEffects.playDeathBell = origBell;
});

test('Sprint 33: Subtitle subscription and live speech updates', async () => {
  let receivedSubtitle = null;
  const unsub = narratorVoice.subscribeSubtitle((sub) => {
    receivedSubtitle = sub;
  });

  narratorVoice.setVoiceEnabled(true);
  const speakPromise = narratorVoice.speak('📢 Thử nghiệm phụ đề trực quan');
  assert.equal(receivedSubtitle, 'Thử nghiệm phụ đề trực quan');

  await speakPromise;
  // Sau khi nói xong, subtitle được dọn sạch về null
  assert.equal(receivedSubtitle, null);

  unsub();
});

test('Sprint 33: stop() cancels speech and clears subtitle', () => {
  let receivedSubtitle = 'initial';
  const unsub = narratorVoice.subscribeSubtitle((sub) => {
    receivedSubtitle = sub;
  });

  const prevCancelCount = cancelCalledCount;
  narratorVoice.speak('Một câu chuyện rất dài đang được kể...');
  assert.ok(receivedSubtitle !== null, 'Subtitle set when speaking');

  narratorVoice.stop();
  assert.ok(cancelCalledCount > prevCancelCount, 'SpeechSynthesis.cancel was called');
  assert.equal(receivedSubtitle, null, 'Subtitle reset to null');

  unsub();
});

test('Sprint 33: When voice is disabled, speak returns false without synthesis', async () => {
  narratorVoice.setVoiceEnabled(false);
  lastSpokenUtterance = null;

  const result = await narratorVoice.speak('Câu này sẽ không được đọc');
  assert.equal(result, false, 'speak returns false when disabled');
  assert.equal(lastSpokenUtterance, null, 'No utterance sent to speechSynthesis');

  // Re-enable for subsequent tests
  narratorVoice.setVoiceEnabled(true);
});
