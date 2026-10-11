/**
 * WebRTC Voice Mesh Engine — Ma Sói Online
 * Thu âm microphone từ thiết bị, truyền âm thanh P2P qua WebRTC MediaStreams
 * và phát trực tiếp ra loa/tai nghe của các người chơi khác trong phòng.
 */

export interface RemoteAudioPeer {
  peerId: string;
  playerId?: string;
  stream: MediaStream;
  audioElement: HTMLAudioElement;
}

function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number = 16000): Int16Array {
  if (inputRate === outputRate) {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return result;
  }
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    const sample = count > 0 ? accum / count : buffer[Math.floor(offsetBuffer)] || 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function int16ToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const float32 = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32[i] = int16Array[i] / 32768.0;
  }
  return float32;
}

export class WebRTCVoiceEngine {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;
  private remotePeers: Map<string, RemoteAudioPeer> = new Map();
  private isMicEnabled: boolean = false;
  private onSpeakingCallback?: (isSpeaking: boolean) => void;
  private scriptProcessor: any = null;
  private playbackAudioContext: AudioContext | null = null;
  private nextPlaybackTime: number = 0;
  private onVoiceChunkCallback: ((chunkBase64: string, sampleRate: number) => void) | null = null;
  private currentAudioRules: any = null;

  constructor() {}

  /**
   * Khởi tạo hoặc lấy Microphone Stream từ thiết bị
   */
  public async enableMicrophone(): Promise<MediaStream> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Thiết bị hoặc trình duyệt không hỗ trợ Web Audio / Microphone.');
    }

    if (!this.localStream) {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch {
          // Fallback cho trình duyệt mobile hoặc Safari iOS hạn chế constraint
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        }

        this.localStream = stream;
        this.setupAudioAnalyzer(stream);
      } catch (err: any) {
        console.warn('[VoiceEngine] Lỗi truy cập Microphone:', err);
        throw new Error('Vui lòng cấp quyền truy cập Micro trên trình duyệt để đàm thoại.');
      }
    }

    // Bật track âm thanh
    this.setMicEnabled(true);
    return this.localStream;
  }

  /**
   * Bật hoặc tắt trạng thái Mic của người chơi
   */
  public setMicEnabled(enabled: boolean): void {
    this.isMicEnabled = enabled;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }

    if (!enabled && this.onSpeakingCallback) {
      this.onSpeakingCallback(false);
    }
  }

  public getIsMicEnabled(): boolean {
    return this.isMicEnabled;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Thiết lập Audio Analyser để phát hiện người chơi đang phát biểu (Voice Activity Detection - VAD)
   */
  private setupAudioAnalyzer(stream: MediaStream) {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // ScriptProcessorNode để trích xuất PCM Audio Chunks phát qua Cloud Relay (hỗ trợ 100% 4G/5G/WiFi)
      if (this.audioContext.createScriptProcessor) {
        try {
          const bufferSize = 4096;
          const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
          let accumulated: Float32Array[] = [];
          let accumulatedSamples = 0;
          const targetSamples = Math.round(this.audioContext.sampleRate * 0.25); // ~250ms chunks

          processor.onaudioprocess = (e: any) => {
            if (!this.isMicEnabled || !this.onVoiceChunkCallback) return;
            const channelData = e.inputBuffer.getChannelData(0);
            accumulated.push(new Float32Array(channelData));
            accumulatedSamples += channelData.length;

            if (accumulatedSamples >= targetSamples) {
              const merged = new Float32Array(accumulatedSamples);
              let offset = 0;
              for (const chunk of accumulated) {
                merged.set(chunk, offset);
                offset += chunk.length;
              }
              accumulated = [];
              accumulatedSamples = 0;

              // Bỏ qua khoảng lặng (silence suppression để tiết kiệm băng thông)
              let energy = 0;
              for (let i = 0; i < merged.length; i++) {
                energy += Math.abs(merged[i]);
              }
              if (energy / merged.length < 0.005) return;

              // Downsample xuống 16000 Hz Int16 PCM
              const downsampled = downsampleBuffer(merged, this.audioContext!.sampleRate, 16000);
              const base64 = int16ToBase64(downsampled);
              this.onVoiceChunkCallback(base64, 16000);
            }
          };

          source.connect(processor);
          // Cần dummy gain để browser không garbage-collect processor
          const dummyGain = this.audioContext.createGain();
          dummyGain.gain.value = 0;
          processor.connect(dummyGain);
          dummyGain.connect(this.audioContext.destination);
          this.scriptProcessor = processor;
        } catch (procErr) {
          console.warn('[VoiceEngine] Không thể khởi tạo ScriptProcessor:', procErr);
        }
      }

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let wasSpeaking = false;
      this.vadInterval = setInterval(() => {
        if (!this.isMicEnabled || !this.analyser) {
          if (wasSpeaking) {
            wasSpeaking = false;
            this.onSpeakingCallback?.(false);
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Ngưỡng âm lượng phát hiện đang nói (> 12 trên thang 255)
        const isSpeaking = average > 12;
        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          this.onSpeakingCallback?.(isSpeaking);
        }
      }, 120);
    } catch (e) {
      console.warn('[VoiceEngine] Không thể khởi tạo Audio Analyser:', e);
    }
  }

  /**
   * Đăng ký callback nhận các gói audio PCM base64 để truyền qua Cloud Relay
   */
  public setOnVoiceChunk(callback: ((chunkBase64: string, sampleRate: number) => void) | null) {
    this.onVoiceChunkCallback = callback;
  }

  /**
   * Kiểm tra người chơi có được quyền nghe tiếng của người gửi theo luật Ma Sói không
   */
  public isSenderAudible(senderId: string): boolean {
    if (!this.currentAudioRules) return true;
    const { isNight, myRole, isAlive, players } = this.currentAudioRules;
    const sender = players.find((p: any) => p.id === senderId);
    if (!sender) return true;

    if (isNight) {
      // Ban đêm: Chỉ Sói mới được nghe tiếng Sói
      const isSenderWolf = sender.role === 'WEREWOLF';
      const isMeWolf = myRole === 'WEREWOLF';
      return isSenderWolf && isMeWolf;
    } else {
      // Ban ngày: Người sống không được nghe tiếng người chết
      if (isAlive && !sender.isAlive) {
        return false;
      }
      return true;
    }
  }

  /**
   * Phát voice chunk nhận được từ Cloud Relay ra loa thiết bị một cách mượt mà
   */
  public playVoiceChunk(senderId: string, base64: string, sampleRate: number = 16000) {
    if (typeof window === 'undefined') return;
    if (!this.isSenderAudible(senderId)) return;

    try {
      if (!this.playbackAudioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.playbackAudioContext = new AudioCtx();
      }

      if (this.playbackAudioContext.state === 'suspended') {
        this.playbackAudioContext.resume().catch(() => {});
      }

      const float32Samples = base64ToFloat32(base64);
      if (!float32Samples || float32Samples.length === 0) return;

      const audioBuffer = this.playbackAudioContext.createBuffer(1, float32Samples.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackAudioContext.destination);

      const currentTime = this.playbackAudioContext.currentTime;
      if (this.nextPlaybackTime < currentTime) {
        this.nextPlaybackTime = currentTime + 0.03; // 30ms jitter buffer
      }

      source.start(this.nextPlaybackTime);
      this.nextPlaybackTime += audioBuffer.duration;
    } catch (e) {
      console.warn('[VoiceEngine] Lỗi phát voice chunk:', e);
    }
  }

  /**
   * Đăng ký callback khi trạng thái nói thay đổi (để nhấp nháy UI sóng âm)
   */
  public onSpeaking(callback: (isSpeaking: boolean) => void) {
    this.onSpeakingCallback = callback;
  }

  /**
   * Xử lý luồng âm thanh nhận được từ người chơi khác qua WebRTC và phát ra loa
   */
  public attachRemoteAudio(peerId: string, stream: MediaStream, playerId?: string): HTMLAudioElement {
    if (typeof window === 'undefined') return {} as HTMLAudioElement;

    let existing = this.remotePeers.get(peerId);
    if (existing) {
      if (existing.audioElement.srcObject !== stream) {
        existing.audioElement.srcObject = stream;
      }
      existing.stream = stream;
      if (playerId) existing.playerId = playerId;
      existing.audioElement.play().catch(() => {});
      return existing.audioElement;
    }

    const audioEl = document.createElement('audio');
    audioEl.id = `remote-audio-${peerId}`;
    audioEl.autoplay = true;
    audioEl.setAttribute('playsinline', 'true');
    audioEl.setAttribute('webkit-playsinline', 'true');
    audioEl.muted = false;
    audioEl.volume = 1.0;

    // Giữ thẻ audio ẩn trong body trước khi gán srcObject cho iOS Safari
    audioEl.style.display = 'none';
    document.body.appendChild(audioEl);
    audioEl.srcObject = stream;

    audioEl.play().catch((err) => {
      console.warn(`[VoiceEngine] Autoplay bị chặn cho peer ${peerId}, đang chờ user interaction:`, err);
    });

    this.remotePeers.set(peerId, {
      peerId,
      playerId,
      stream,
      audioElement: audioEl,
    });

    return audioEl;
  }

  /**
   * Xóa luồng âm thanh khi người chơi rời phòng
   */
  public removeRemoteAudio(peerId: string) {
    const peer = this.remotePeers.get(peerId);
    if (peer) {
      peer.audioElement.pause();
      peer.audioElement.srcObject = null;
      peer.audioElement.remove();
      this.remotePeers.delete(peerId);
    }
  }

  /**
   * Áp dụng luật phân quyền âm thanh của Ma Sói:
   * - Ban đêm: Chỉ Ma Sói mới được nghe tiếng của nhau; Dân làng bị Mute loa để bảo vệ tĩnh lặng.
   * - Người chết: Không thể phát giọng nói tới người sống.
   */
  public applyGameAudioRules(params: {
    isNight: boolean;
    myRole: string;
    isAlive: boolean;
    players: { id: string; role?: string; isAlive: boolean }[];
  }) {
    this.currentAudioRules = params;
    const { isNight, myRole, isAlive, players } = params;

    // Nếu chính mình đã chết hoặc là dân làng ban đêm -> Tự động khóa mic
    if (!isAlive || (isNight && myRole !== 'WEREWOLF')) {
      if (this.isMicEnabled) {
        this.setMicEnabled(false);
      }
    }

    // Duyệt qua tất cả loa của người khác
    this.remotePeers.forEach((remote) => {
      const sender = players.find((p) => p.id === remote.playerId);
      if (!sender) return;

      if (isNight) {
        // Ban đêm: Chỉ Sói mới được nghe tiếng Sói
        const isSenderWolf = sender.role === 'WEREWOLF';
        const isMeWolf = myRole === 'WEREWOLF';
        remote.audioElement.muted = !(isSenderWolf && isMeWolf);
      } else {
        // Ban ngày: Người sống không được nghe tiếng người chết
        if (isAlive && !sender.isAlive) {
          remote.audioElement.muted = true;
        } else {
          remote.audioElement.muted = false;
        }
      }
    });
  }

  /**
   * Kích hoạt lại toàn bộ luồng phát âm thanh khi người dùng chạm vào màn hình (iOS Safari Autoplay unlock)
   */
  public unlockAudio(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    if (this.playbackAudioContext && this.playbackAudioContext.state === 'suspended') {
      this.playbackAudioContext.resume().catch(() => {});
    }
    this.remotePeers.forEach((peer) => {
      if (peer.audioElement && peer.audioElement.paused && !peer.audioElement.muted) {
        peer.audioElement.play().catch(() => {});
      }
    });
  }

  /**
   * Giải phóng toàn bộ tài nguyên Micro và Loa
   */
  public destroy() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.playbackAudioContext) {
      try {
        this.playbackAudioContext.close();
      } catch {}
      this.playbackAudioContext = null;
    }

    this.nextPlaybackTime = 0;
    this.onVoiceChunkCallback = null;

    this.remotePeers.forEach((p) => {
      p.audioElement.pause();
      p.audioElement.srcObject = null;
      p.audioElement.remove();
    });
    this.remotePeers.clear();
    this.isMicEnabled = false;
  }
}

// Singleton export
export const voiceEngine = new WebRTCVoiceEngine();

// Tự động unlock AudioContext & loa ngoài ngay khi người dùng chạm vào màn hình
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    voiceEngine.unlockAudio();
  };
  window.addEventListener('click', resumeAudio, { passive: true });
  window.addEventListener('touchstart', resumeAudio, { passive: true });
}

