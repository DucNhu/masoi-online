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

export class WebRTCVoiceEngine {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: any = null;
  private remotePeers: Map<string, RemoteAudioPeer> = new Map();
  private isMicEnabled: boolean = false;
  private onSpeakingCallback?: (isSpeaking: boolean) => void;

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

