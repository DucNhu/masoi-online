import { RemoteRoamPlayer, DEFAULT_OUTFIT } from '../components/arena3d/types';
import { createResilientMqttClient } from './mqttRoomMesh';

export const ROAM_MQTT_TOPIC = 'masoi/v2/campgrounds/roam';
const BROADCAST_CHANNEL_NAME = 'masoi_campgrounds_roam_mesh';

export type RoamPlayerListener = (player: RemoteRoamPlayer) => void;
export type RoamPlayerLeaveListener = (playerId: string) => void;
export type OnlineCountListener = (count: number) => void;

export class CampfireRoamMesh {
  public clientId: string = '';
  private client: any = null;
  private channel: BroadcastChannel | null = null;
  private localPlayer: RemoteRoamPlayer | null = null;
  private remotePlayers: Map<string, RemoteRoamPlayer> = new Map();
  private updateListeners: Set<RoamPlayerListener> = new Set();
  private leaveListeners: Set<RoamPlayerLeaveListener> = new Set();
  private countListeners: Set<OnlineCountListener> = new Set();
  private isDestroyed = false;
  private lastBroadcastTime = 0;
  private heartbeatTimer: any = null;
  private pruneTimer: any = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor() {
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    if (typeof window === 'undefined') {
      return `roam_node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    try {
      let tabId = sessionStorage.getItem('masoi_roam_tab_id');
      if (!tabId) {
        tabId = Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('masoi_roam_tab_id', tabId);
      }
      const rawUser = sessionStorage.getItem('masoi_tab_account') || localStorage.getItem('masoi_account_username') || 'hunter';
      const cleanUser = rawUser.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'hunter';
      return `roam_${cleanUser}_${tabId}`;
    } catch {
      return `roam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
  }

  /**
   * Khởi động mạng đồng bộ 3D Metaverse Campfire
   */
  public start(initialPlayer?: Partial<RemoteRoamPlayer>): void {
    if (this.isDestroyed) {
      this.isDestroyed = false;
    }

    if (initialPlayer) {
      this.localPlayer = {
        id: this.clientId,
        name: initialPlayer.name || 'Thợ Săn Đêm',
        outfit: initialPlayer.outfit || DEFAULT_OUTFIT,
        position: initialPlayer.position || { x: 0, y: 0.05, z: 5.8 },
        facingAngle: initialPlayer.facingAngle ?? Math.PI,
        anim: initialPlayer.anim || 'idle',
        isRoaming: initialPlayer.isRoaming ?? true,
        seatNumber: initialPlayer.seatNumber ?? null,
        tentId: initialPlayer.tentId || 'tent-1',
        updatedAt: Date.now(),
      };
    }

    // 1. Kênh BroadcastChannel nội bộ thiết bị (0ms latency giữa 2 tab cùng trình duyệt)
    if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
      try {
        if (!this.channel) {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            this.handleIncomingRawMessage(event.data);
          };
        }
      } catch {
        // Fallback
      }
    }

    // 2. Kênh Cloud MQTT Relay xuyên mạng (hỗ trợ 100% kết nối giữa PC và Điện thoại qua 4G/WiFi)
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      if (!this.client) {
        this.client = createResilientMqttClient(`cli_${this.clientId}`, () => {
          if (this.isDestroyed) return;
          this.client.subscribe([ROAM_MQTT_TOPIC], (err: any) => {
            if (!err && this.localPlayer) {
              this.broadcastDirect(this.localPlayer);
            }
          });

          this.client.on('message', (_topic: string, messageBuffer: Buffer) => {
            if (this.isDestroyed) return;
            try {
              const raw = messageBuffer.toString();
              const msg = JSON.parse(raw);
              this.handleIncomingRawMessage(msg);
            } catch {}
          });
        });
      }

      // Xử lý khi đóng tab hoặc reload để báo cho máy khác xóa model ngay
      if (!this.beforeUnloadHandler) {
        this.beforeUnloadHandler = () => {
          this.broadcastLeave();
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
      }
    }

    // 3. Heartbeat định kỳ gửi nhịp tim giữ kết nối
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        if (this.localPlayer && !this.isDestroyed) {
          this.localPlayer.updatedAt = Date.now();
          this.broadcastDirect(this.localPlayer);
        }
      }, 1800);
    }

    // 4. Timer dọn dẹp các nhân vật bị mất kết nối quá 6 giây
    if (!this.pruneTimer) {
      this.pruneTimer = setInterval(() => {
        const now = Date.now();
        let changed = false;
        for (const [id, player] of this.remotePlayers.entries()) {
          if (now - player.updatedAt > 6000) {
            this.remotePlayers.delete(id);
            this.notifyLeave(id);
            changed = true;
          }
        }
        if (changed) {
          this.notifyCount();
        }
      }, 2000);
    }
  }

  private handleIncomingRawMessage(msg: any): void {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'ROAM_UPDATE' && msg.player && msg.player.id) {
      if (msg.player.id === this.clientId) return; // Bỏ qua chính mình

      const player: RemoteRoamPlayer = {
        ...msg.player,
        updatedAt: Date.now(),
      };
      const isNew = !this.remotePlayers.has(player.id);
      this.remotePlayers.set(player.id, player);
      this.notifyUpdate(player);
      if (isNew) {
        this.notifyCount();
      }
    } else if (msg.type === 'ROAM_LEAVE' && msg.playerId) {
      if (msg.playerId === this.clientId) return;
      if (this.remotePlayers.has(msg.playerId)) {
        this.remotePlayers.delete(msg.playerId);
        this.notifyLeave(msg.playerId);
        this.notifyCount();
      }
    }
  }

  /**
   * Cập nhật và phát sóng vị trí nhân vật (có áp dụng throttle ~80ms)
   */
  public broadcastMyPosition(patch: Partial<RemoteRoamPlayer>): void {
    if (this.isDestroyed) return;

    if (!this.localPlayer) {
      this.start(patch);
      return;
    }

    Object.assign(this.localPlayer, patch);
    this.localPlayer.updatedAt = Date.now();

    const now = performance.now();
    // Throttle tối đa 12fps (~80ms) để giữ độ trễ siêu thấp mà không làm nghẽn băng thông
    if (now - this.lastBroadcastTime >= 80) {
      this.lastBroadcastTime = now;
      this.broadcastDirect(this.localPlayer);
    }
  }

  private broadcastDirect(player: RemoteRoamPlayer): void {
    const payload = {
      type: 'ROAM_UPDATE',
      player,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }

    if (this.client) {
      try {
        this.client.publish(ROAM_MQTT_TOPIC, JSON.stringify(payload));
      } catch {}
    }
  }

  private broadcastLeave(): void {
    const payload = {
      type: 'ROAM_LEAVE',
      playerId: this.clientId,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }

    if (this.client) {
      try {
        this.client.publish(ROAM_MQTT_TOPIC, JSON.stringify(payload));
      } catch {}
    }
  }

  public getOnlinePlayers(): RemoteRoamPlayer[] {
    return Array.from(this.remotePlayers.values());
  }

  public getOnlineCount(): number {
    return this.remotePlayers.size + (this.localPlayer ? 1 : 0);
  }

  public onPlayerUpdate(listener: RoamPlayerListener): () => void {
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  public onPlayerLeave(listener: RoamPlayerLeaveListener): () => void {
    this.leaveListeners.add(listener);
    return () => {
      this.leaveListeners.delete(listener);
    };
  }

  public onOnlineCountChange(listener: OnlineCountListener): () => void {
    this.countListeners.add(listener);
    listener(this.getOnlineCount());
    return () => {
      this.countListeners.delete(listener);
    };
  }

  private notifyUpdate(player: RemoteRoamPlayer): void {
    this.updateListeners.forEach((fn) => {
      try {
        fn(player);
      } catch {}
    });
  }

  private notifyLeave(playerId: string): void {
    this.leaveListeners.forEach((fn) => {
      try {
        fn(playerId);
      } catch {}
    });
  }

  private notifyCount(): void {
    const count = this.getOnlineCount();
    this.countListeners.forEach((fn) => {
      try {
        fn(count);
      } catch {}
    });
  }

  /**
   * Ngắt kết nối và giải phóng tài nguyên
   */
  public stop(): void {
    this.broadcastLeave();
    this.isDestroyed = true;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }

    this.remotePlayers.clear();
    this.updateListeners.clear();
    this.leaveListeners.clear();
    this.countListeners.clear();
  }
}

export const campfireRoamMesh = new CampfireRoamMesh();
