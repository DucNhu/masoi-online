import * as mqttPkg from 'mqtt';
import { ClientGameState, ServerGameState, PublicTableInfo } from '../types/multiplayer';
import { maskGameStateForPlayer } from './roomProtocol';
import { voiceEngine } from './webrtcVoiceMesh';

// Hỗ trợ cả ESM default export lẫn named export giữa browser Vite bundle và Node.js runtime
const mqtt = (mqttPkg as any)?.default || mqttPkg;

/**
 * Danh sách các Public MQTT WSS Brokers hỗ trợ TLS/WebSocket toàn cầu.
 * Tự động chuyển đổi dự phòng (failover) nếu một broker gặp sự cố mạng hoặc bảo trì.
 */
export const CLOUD_MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

const MQTT_TOPIC_PREFIX = 'masoi/v2/';

export interface CloudJoinRequestPayload {
  playerName: string;
  avatar: string;
  isSpectator: boolean;
  clientId: string;
}

export interface CloudJoinResponsePayload {
  success: boolean;
  message?: string;
  playerId?: string;
  sessionToken?: string;
  state?: ClientGameState;
}

export interface CloudActionMessage {
  type: string;
  senderId?: string;
  payload?: any;
}

/**
 * Tạo kết nối MQTT với khả năng tự thử broker tiếp theo nếu kết nối đầu tiên thất bại
 */
export function createResilientMqttClient(
  customClientId?: string,
  onConnected?: () => void,
  brokerIndex: number = 0
): any {
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  if (!isBrowser) {
    // Headless safe mock for Node.js test runner
    return {
      on: () => {},
      once: () => {},
      subscribe: (_: any, cb?: any) => cb && cb(null),
      publish: () => {},
      end: () => {},
      unsubscribe: () => {},
    };
  }

  const broker = CLOUD_MQTT_BROKERS[brokerIndex % CLOUD_MQTT_BROKERS.length];
  const clientId = customClientId || `masoi_cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    const client = mqtt.connect(broker, {
      clientId,
      keepalive: 30,
      reconnectPeriod: 3000,
      connectTimeout: 8000,
      clean: true,
    });

    if (onConnected) {
      client.once('connect', onConnected);
    }

    // Tự động chuyển broker nếu xảy ra lỗi kết nối ban đầu
    client.once('error', (err: any) => {
      console.warn(`[CloudRelay] Lỗi kết nối tới broker ${broker}:`, err?.message || err);
    });

    return client;
  } catch (err) {
    console.warn(`[CloudRelay] Không thể khởi tạo MQTT client:`, err);
    return null;
  }
}

/**
 * Cloud Room Host
 * Chạy trên máy của người tạo phòng (Host). Tiếp nhận kết nối và hành động từ mọi thiết bị 4G/WiFi.
 */
export class CloudRoomHost {
  private client: any = null;
  private isDestroyed: boolean = false;
  private announcementInterval: any = null;
  public isReady: boolean = false;

  constructor(
    public readonly roomId: string,
    private readonly onClientAction: (senderId: string, actionType: string, payload: any) => void,
    private readonly onClientJoin: (
      playerName: string,
      avatar: string,
      isSpectator: boolean
    ) => { playerId: string; sessionToken: string } | null,
    private readonly getClientMaskedState: (playerId: string) => ClientGameState | null,
    private readonly getPublicTableInfo: () => PublicTableInfo | null
  ) {}

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      const cleanId = this.roomId.toUpperCase();
      const hostMqttId = `masoi_host_${cleanId}_${Date.now()}`;

      this.client = createResilientMqttClient(hostMqttId, () => {
        this.isReady = true;
        this.subscribeTopics();
        this.startAnnouncements();
        resolve();
      });

      if (!this.client) {
        this.isReady = true;
        resolve();
        return;
      }

      // Đảm bảo không bị treo Promise nếu mạng chậm
      setTimeout(() => {
        if (!this.isReady) {
          this.isReady = true;
          resolve();
        }
      }, 5000);
    });
  }

  private subscribeTopics() {
    if (!this.client || this.isDestroyed) return;
    const cleanId = this.roomId.toUpperCase();
    const actionsTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/actions`;
    const voiceTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/voice`;

    this.client.subscribe([actionsTopic, voiceTopic], (err: any) => {
      if (err) {
        console.warn(`[CloudHost] Không thể đăng ký topics:`, err);
      }
    });

    this.client.on('message', (topic: string, messageBuffer: Buffer) => {
      if (this.isDestroyed) return;
      try {
        const raw = messageBuffer.toString();
        const msg = JSON.parse(raw);
        this.handleIncomingMessage(topic, msg);
      } catch (err) {
        console.warn(`[CloudHost] Lỗi parse message từ topic ${topic}:`, err);
      }
    });
  }

  private handleIncomingMessage(topic: string, msg: any) {
    const cleanId = this.roomId.toUpperCase();
    if (!topic.includes(cleanId) || !msg) return;

    // Tiếp nhận và phát voice chunk tới loa ngoài của Host
    if (msg.type === 'VOICE_CHUNK' && msg.senderId && msg.audio) {
      voiceEngine.playVoiceChunk(msg.senderId, msg.audio, msg.sampleRate || 16000);
      return;
    }

    if (msg.type === 'JOIN_REQUEST') {
      const payload: CloudJoinRequestPayload = msg.payload;
      if (!payload?.clientId) return;

      const joinResult = this.onClientJoin(
        payload.playerName || 'Thợ Săn Mới',
        payload.avatar || '🐺',
        Boolean(payload.isSpectator)
      );

      const responseTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/client/${payload.clientId}/join_response`;

      if (!joinResult) {
        this.publish(responseTopic, {
          success: false,
          message: 'Bàn chơi đã đầy hoặc không thể tham gia.',
        });
        return;
      }

      const maskedState = this.getClientMaskedState(joinResult.playerId);
      this.publish(responseTopic, {
        success: true,
        playerId: joinResult.playerId,
        sessionToken: joinResult.sessionToken,
        state: maskedState,
      });

      // Phát cập nhật bàn chơi lên sảnh
      this.announceRoom();
    } else if (msg.type === 'CLIENT_ACTION') {
      if (msg.senderId && msg.actionType) {
        this.onClientAction(msg.senderId, msg.actionType, msg.payload);
      }
    }
  }

  /**
   * Phát sóng giọng nói của Host tới toàn bộ người chơi trong phòng qua Cloud Relay
   */
  public broadcastVoice(senderId: string, audioBase64: string, sampleRate: number = 16000) {
    if (!this.client || this.isDestroyed) return;
    const cleanId = this.roomId.toUpperCase();
    const voiceTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/voice`;
    this.publish(voiceTopic, {
      type: 'VOICE_CHUNK',
      senderId,
      audio: audioBase64,
      sampleRate,
    });
  }

  /**
   * Phát masked state an toàn tới từng người chơi (Zero-Knowledge)
   */
  public broadcastState(serverState: ServerGameState) {
    if (!this.client || this.isDestroyed) return;
    const cleanId = this.roomId.toUpperCase();

    // 1. Gửi masked state cho từng người chơi
    for (const player of serverState.players) {
      const masked = this.getClientMaskedState(player.id);
      if (masked) {
        const playerTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/player/${player.id}/state`;
        this.publish(playerTopic, {
          type: 'STATE_UPDATE',
          state: masked,
        });
      }
    }

    // 2. Gửi masked state cho từng khán giả
    if (serverState.spectators && serverState.spectators.length > 0) {
      for (const spectator of serverState.spectators) {
        const masked = this.getClientMaskedState(spectator.id);
        if (masked) {
          const specTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/player/${spectator.id}/state`;
          this.publish(specTopic, {
            type: 'STATE_UPDATE',
            state: masked,
          });
        }
      }
    }

    // 3. Thông báo cho Lobby cập nhật số người / trạng thái pha
    this.announceRoom();
  }

  /**
   * Phát thông tin bàn chơi lên Lobby toàn hệ thống
   */
  public announceRoom() {
    if (!this.client || this.isDestroyed) return;
    const tableInfo = this.getPublicTableInfo();
    if (tableInfo && !tableInfo.isPrivate) {
      const lobbyTopic = `${MQTT_TOPIC_PREFIX}lobby/announcements`;
      this.publish(lobbyTopic, {
        type: 'TABLE_UPDATE',
        table: tableInfo,
        timestamp: Date.now(),
      });
    }
  }

  private startAnnouncements() {
    // Phát ngay lập tức khi mở phòng
    this.announceRoom();

    // Nhịp tim định kỳ mỗi 5s để các máy khác biết phòng còn hoạt động
    this.announcementInterval = setInterval(() => {
      this.announceRoom();
    }, 5000);
  }

  private publish(topic: string, data: any) {
    if (!this.client || this.isDestroyed) return;
    try {
      this.client.publish(topic, JSON.stringify(data));
    } catch (e) {
      console.warn(`[CloudHost] Lỗi gửi message tới ${topic}:`, e);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.announcementInterval) {
      clearInterval(this.announcementInterval);
      this.announcementInterval = null;
    }

    const cleanId = this.roomId.toUpperCase();
    // Báo cho sảnh và người chơi phòng đã đóng
    this.publish(`${MQTT_TOPIC_PREFIX}lobby/announcements`, {
      type: 'TABLE_CLOSED',
      roomId: cleanId,
    });
    this.publish(`${MQTT_TOPIC_PREFIX}rooms/${cleanId}/broadcast`, {
      type: 'ROOM_CLOSED',
    });

    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.isReady = false;
  }
}

/**
 * Cloud Room Client
 * Chạy trên máy của người tham gia bàn chơi (ví dụ: Điện thoại 4G).
 */
export class CloudRoomClient {
  private client: any = null;
  private isDestroyed: boolean = false;
  public isConnected: boolean = false;
  private currentClientId: string = '';
  private myPlayerId: string = '';

  constructor(
    public readonly roomId: string,
    private readonly onStateReceived: (state: ClientGameState) => void,
    private readonly onDisconnected?: () => void
  ) {}

  public connect(
    playerName: string,
    avatar: string,
    isSpectator: boolean = false
  ): Promise<{ playerId: string; sessionToken: string; state: ClientGameState }> {
    return new Promise((resolve, reject) => {
      const cleanId = this.roomId.toUpperCase();
      const clientId = `masoi_player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.currentClientId = clientId;

      let isSettled = false;
      const timeoutMs = 7000;

      const cleanupAndReject = (err: Error) => {
        if (isSettled) return;
        isSettled = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.disconnect();
        reject(err);
      };

      const cleanupAndResolve = (result: { playerId: string; sessionToken: string; state: ClientGameState }) => {
        if (isSettled) return;
        isSettled = true;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        resolve(result);
      };

      const timeoutHandle = setTimeout(() => {
        cleanupAndReject(
          new Error(
            `Không tìm thấy phòng chơi "${cleanId}" hoặc Host đang bận. Vui lòng kiểm tra mã phòng 6 ký tự hoặc đảm bảo Host vẫn đang mở phòng.`
          )
        );
      }, timeoutMs);

      this.client = createResilientMqttClient(clientId, () => {
        const joinResponseTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/client/${clientId}/join_response`;
        const broadcastTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/broadcast`;
        const voiceTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/voice`;

        this.client.subscribe([joinResponseTopic, broadcastTopic, voiceTopic], (err: any) => {
          if (err) {
            cleanupAndReject(new Error(`Không thể đăng ký kênh truyền tín hiệu phòng: ${err?.message || err}`));
            return;
          }

          // Gửi yêu cầu vào phòng tới Host
          const actionsTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/actions`;
          this.client.publish(
            actionsTopic,
            JSON.stringify({
              type: 'JOIN_REQUEST',
              payload: {
                playerName,
                avatar,
                isSpectator,
                clientId,
              },
            })
          );
        });

        this.client.on('message', (topic: string, messageBuffer: Buffer) => {
          if (this.isDestroyed) return;
          try {
            const raw = messageBuffer.toString();
            const msg = JSON.parse(raw);

            // 1. Nhận phản hồi vào phòng
            if (topic.includes(`/client/${clientId}/join_response`)) {
              if (!msg.success) {
                cleanupAndReject(new Error(msg.message || 'Yêu cầu vào phòng bị từ chối.'));
                return;
              }

              this.isConnected = true;
              this.myPlayerId = msg.playerId;

              // Đăng ký nhận state riêng của mình từ Host
              const playerStateTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/player/${msg.playerId}/state`;
              this.client.subscribe([playerStateTopic], () => {});

              cleanupAndResolve({
                playerId: msg.playerId,
                sessionToken: msg.sessionToken,
                state: msg.state,
              });
            }

            // 2. Nhận state cập nhật trong quá trình chơi
            if (topic.includes(`/player/${this.myPlayerId}/state`)) {
              if (msg.type === 'STATE_UPDATE' && msg.state) {
                this.onStateReceived(msg.state);
              }
            }

            // 3. Thông báo phòng bị đóng
            if (topic.includes(`/broadcast`) && msg.type === 'ROOM_CLOSED') {
              if (this.onDisconnected) {
                this.onDisconnected();
              }
            }

            // 4. Nhận voice audio chunks từ người chơi khác qua Cloud Relay
            if (topic.includes(`/voice`)) {
              if (msg.type === 'VOICE_CHUNK' && msg.senderId && msg.audio) {
                if (msg.senderId !== this.myPlayerId) {
                  voiceEngine.playVoiceChunk(msg.senderId, msg.audio, msg.sampleRate || 16000);
                }
              }
            }
          } catch (err) {
            console.warn(`[CloudClient] Lỗi xử lý gói tin từ ${topic}:`, err);
          }
        });
      });

      if (!this.client) {
        cleanupAndReject(new Error('Môi trường trình duyệt không hỗ trợ kết nối mạng WebSocket.'));
      }
    });
  }

  /**
   * Phát sóng giọng nói của Client tới toàn bộ người chơi trong phòng qua Cloud Relay
   */
  public broadcastVoice(senderId: string, audioBase64: string, sampleRate: number = 16000) {
    if (!this.client || this.isDestroyed) return;
    const cleanId = this.roomId.toUpperCase();
    const voiceTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/voice`;
    try {
      this.client.publish(
        voiceTopic,
        JSON.stringify({
          type: 'VOICE_CHUNK',
          senderId,
          audio: audioBase64,
          sampleRate,
        })
      );
    } catch (e) {
      console.warn('[CloudClient] Lỗi gửi voice chunk:', e);
    }
  }

  /**
   * Gửi hành động tới Host qua Cloud Relay
   */
  public sendAction(senderId: string, actionType: string, payload?: any) {
    if (!this.client || this.isDestroyed) return;
    const cleanId = this.roomId.toUpperCase();
    const actionsTopic = `${MQTT_TOPIC_PREFIX}rooms/${cleanId}/actions`;

    try {
      this.client.publish(
        actionsTopic,
        JSON.stringify({
          type: 'CLIENT_ACTION',
          senderId,
          actionType,
          payload,
        })
      );
    } catch (e) {
      console.warn(`[CloudClient] Lỗi gửi action ${actionType}:`, e);
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    this.isConnected = false;
    if (this.client) {
      if (this.myPlayerId) {
        this.sendAction(this.myPlayerId, 'LEAVE');
      }
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
  }
}

/**
 * Cloud Lobby Watcher
 * Lắng nghe toàn bộ thông báo bàn chơi công khai từ các thiết bị khác nhau trên mạng Internet.
 */
export class CloudLobbyWatcher {
  private client: any = null;
  private tables: Map<string, { table: PublicTableInfo; lastSeen: number }> = new Map();
  private listeners: Set<(tables: PublicTableInfo[]) => void> = new Set();
  private isDestroyed: boolean = false;
  private cleanupInterval: any = null;

  constructor() {}

  public start() {
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
    if (this.client || this.isDestroyed) return;

    this.client = createResilientMqttClient(`masoi_lobby_watcher_${Date.now()}`, () => {
      const lobbyTopic = `${MQTT_TOPIC_PREFIX}lobby/announcements`;
      this.client.subscribe([lobbyTopic]);

      this.client.on('message', (_topic: string, messageBuffer: Buffer) => {
        try {
          const raw = messageBuffer.toString();
          const msg = JSON.parse(raw);

          if (msg.type === 'TABLE_UPDATE' && msg.table?.roomId) {
            this.tables.set(msg.table.roomId.toUpperCase(), {
              table: msg.table,
              lastSeen: Date.now(),
            });
            this.notify();
          } else if (msg.type === 'TABLE_CLOSED' && msg.roomId) {
            this.tables.delete(msg.roomId.toUpperCase());
            this.notify();
          }
        } catch {}
      });
    });

    // Dọn dẹp bàn không còn gửi nhịp tim sau 16 giây
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [roomId, entry] of this.tables.entries()) {
        if (now - entry.lastSeen > 16000) {
          this.tables.delete(roomId);
          changed = true;
        }
      }
      if (changed) {
        this.notify();
      }
    }, 5000);
  }

  public getPublicTables(): PublicTableInfo[] {
    return Array.from(this.tables.values()).map((e) => e.table);
  }

  public subscribe(listener: (tables: PublicTableInfo[]) => void): () => void {
    this.listeners.add(listener);
    // Báo ngay danh sách hiện có
    listener(this.getPublicTables());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = this.getPublicTables();
    this.listeners.forEach((l) => l(list));
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.tables.clear();
    this.listeners.clear();
  }
}

// Singleton Cloud Lobby Watcher
export const cloudLobbyWatcher = new CloudLobbyWatcher();
