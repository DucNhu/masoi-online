import peerPkg, { type DataConnection } from 'peerjs';
import { ClientGameState, ServerGameState } from '../types/multiplayer';
import { maskGameStateForPlayer } from './roomProtocol';
import { voiceEngine } from './webrtcVoiceMesh';

// Hỗ trợ cả ESM default export lẫn named export giữa browser Vite bundle và Node.js runtime
const PeerConstructor = (peerPkg as any)?.Peer || (peerPkg as any)?.default || peerPkg;

export interface P2PMessage {
  type: 'JOIN_REQUEST' | 'JOIN_ACCEPTED' | 'JOIN_REJECTED' | 'STATE_UPDATE' | 'CLIENT_ACTION' | 'HEARTBEAT';
  roomId: string;
  senderId?: string;
  payload?: any;
}

const PEER_PREFIX = 'masoi-v1-';
const GOOGLE_STUN = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * P2P WebRTC Host Engine
 * Chạy trên máy của người tạo phòng (Host) khi chơi qua GitHub Pages
 */
export class P2PRoomHost {
  private peer: any = null;
  private connections: Map<string, DataConnection> = new Map(); // conn.peer -> connection
  private playerPeerMap: Map<string, string> = new Map(); // playerId -> conn.peer
  private peerPlayerMap: Map<string, string> = new Map(); // conn.peer -> playerId
  public isReady: boolean = false;

  constructor(
    public readonly roomId: string,
    private readonly onClientAction: (senderId: string, actionType: string, payload: any) => void,
    private readonly onClientJoin: (playerName: string, avatar: string, isSpectator: boolean, peerId?: string) => { playerId: string; sessionToken: string } | null,
    private readonly getClientMaskedState: (playerId: string) => ClientGameState | null
  ) {}

  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof window.RTCPeerConnection === 'undefined') {
        this.isReady = true;
        resolve(`${PEER_PREFIX}${this.roomId.toUpperCase()}`);
        return;
      }
      try {
        const peerId = `${PEER_PREFIX}${this.roomId.toUpperCase()}`;
        this.peer = new PeerConstructor(peerId, { config: GOOGLE_STUN });

        this.peer.on('open', (id: string) => {
          this.isReady = true;
          resolve(id);
        });

        this.peer.on('connection', (conn: any) => {
          this.handleIncomingConnection(conn);
        });

        // Lắng nghe cuộc gọi voice audio từ các client
        this.peer.on('call', (mediaConn: any) => {
          try {
            const localStream = voiceEngine.getLocalStream();
            mediaConn.answer(localStream || undefined);
            mediaConn.on('stream', (remoteStream: MediaStream) => {
              const playerId = this.peerPlayerMap.get(mediaConn.peer);
              voiceEngine.attachRemoteAudio(mediaConn.peer, remoteStream, playerId);
            });
          } catch (e) {
            console.warn('[P2PHost] Lỗi tiếp nhận voice stream:', e);
          }
        });

        this.peer.on('error', (err: any) => {
          console.warn('[P2PHost] Peer error:', err);
          if (!this.isReady) reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (raw: unknown) => {
      const msg = raw as P2PMessage;
      if (!msg || msg.roomId !== this.roomId) return;

      if (msg.type === 'JOIN_REQUEST') {
        const { playerName, avatar, isSpectator } = msg.payload || {};
        const joinResult = this.onClientJoin(playerName || 'Khách', avatar || '🐺', Boolean(isSpectator), conn.peer);

        if (!joinResult) {
          conn.send({
            type: 'JOIN_REJECTED',
            roomId: this.roomId,
            payload: { message: 'Bàn chơi đã đầy hoặc không thể tham gia.' },
          } as P2PMessage);
          return;
        }

        this.playerPeerMap.set(joinResult.playerId, conn.peer);
        this.peerPlayerMap.set(conn.peer, joinResult.playerId);
        const state = this.getClientMaskedState(joinResult.playerId);

        conn.send({
          type: 'JOIN_ACCEPTED',
          roomId: this.roomId,
          senderId: joinResult.playerId,
          payload: {
            playerId: joinResult.playerId,
            sessionToken: joinResult.sessionToken,
            state,
          },
        } as P2PMessage);

        // Nếu Host đã bật mic trước đó, gọi audio tới client mới vào phòng
        const localStream = voiceEngine.getLocalStream();
        if (localStream && this.peer) {
          try {
            const call = this.peer.call(conn.peer, localStream);
            if (call) {
              call.on('stream', (remoteStream: MediaStream) => {
                voiceEngine.attachRemoteAudio(conn.peer, remoteStream, joinResult.playerId);
              });
            }
          } catch {}
        }
      } else if (msg.type === 'CLIENT_ACTION') {
        if (msg.senderId) {
          this.onClientAction(msg.senderId, msg.payload?.actionType, msg.payload?.data);
        }
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      const pid = this.peerPlayerMap.get(conn.peer);
      if (pid) this.playerPeerMap.delete(pid);
      this.peerPlayerMap.delete(conn.peer);
      voiceEngine.removeRemoteAudio(conn.peer);
    });
  }

  /**
   * Khởi tạo cuộc gọi audio tới tất cả người chơi khi Host bật micro
   */
  public callAllClientsAudio(stream: MediaStream) {
    if (!this.peer || !this.isReady) return;
    for (const [playerId, peerId] of this.playerPeerMap.entries()) {
      try {
        const mediaConn = this.peer.call(peerId, stream);
        if (mediaConn) {
          mediaConn.on('stream', (remoteStream: MediaStream) => {
            voiceEngine.attachRemoteAudio(peerId, remoteStream, playerId);
          });
        }
      } catch (err) {
        console.warn(`[P2PHost] Không thể gửi audio call tới ${playerId}:`, err);
      }
    }
  }

  /**
   * Phát sóng cập nhật trạng thái bí mật tới từng người chơi qua WebRTC
   */
  public broadcastState(serverState: ServerGameState) {
    for (const [playerId, peerId] of this.playerPeerMap.entries()) {
      const conn = this.connections.get(peerId);
      if (conn && conn.open) {
        const masked = maskGameStateForPlayer(serverState, playerId);
        conn.send({
          type: 'STATE_UPDATE',
          roomId: this.roomId,
          payload: { state: masked },
        } as P2PMessage);
      }
    }
  }

  public destroy() {
    this.connections.forEach((c) => c.close());
    this.connections.clear();
    this.playerPeerMap.clear();
    this.peerPlayerMap.clear();
    voiceEngine.destroy();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isReady = false;
  }
}

/**
 * P2P WebRTC Client Engine
 * Chạy trên máy của người tham gia bàn chơi qua GitHub Pages
 */
export class P2PRoomClient {
  private peer: any = null;
  private conn: DataConnection | null = null;
  public isConnected: boolean = false;

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
      if (typeof window === 'undefined' || typeof window.RTCPeerConnection === 'undefined') {
        const fakePlayerId = `player_test_${Date.now()}`;
        this.isConnected = true;
        resolve({
          playerId: fakePlayerId,
          sessionToken: `token_test_${Date.now()}`,
          state: {
            roomId: this.roomId,
            tableName: 'Test Room',
            arenaTheme: 'BLOOD_MOON',
            phase: 'LOBBY',
            dayNumber: 0,
            timerSeconds: 0,
            mayorPlayerId: null,
            players: [],
            chatMessages: [],
            winner: null,
            historyLog: [],
            myPlayerId: fakePlayerId,
            myRole: 'VILLAGER',
            revealedRoles: {},
            teamMates: [],
            spectatorsCount: 0,
            liveCheers: [],
          },
        });
        return;
      }
      try {
        this.peer = new PeerConstructor({ config: GOOGLE_STUN });

        this.peer.on('open', () => {
          const hostPeerId = `${PEER_PREFIX}${this.roomId.toUpperCase()}`;
          const conn = this.peer!.connect(hostPeerId, { reliable: true });
          this.conn = conn;

          conn.on('open', () => {
            this.isConnected = true;
            // Gửi yêu cầu vào bàn tới Host
            conn.send({
              type: 'JOIN_REQUEST',
              roomId: this.roomId,
              payload: { playerName, avatar, isSpectator },
            } as P2PMessage);
          });

          conn.on('data', (raw: unknown) => {
            const msg = raw as P2PMessage;
            if (msg.type === 'JOIN_ACCEPTED') {
              resolve({
                playerId: msg.payload.playerId,
                sessionToken: msg.payload.sessionToken,
                state: msg.payload.state,
              });
            } else if (msg.type === 'JOIN_REJECTED') {
              reject(new Error(msg.payload?.message || 'Host từ chối yêu cầu vào bàn.'));
            } else if (msg.type === 'STATE_UPDATE' && msg.payload?.state) {
              this.onStateReceived(msg.payload.state);
            }
          });

          conn.on('close', () => {
            this.isConnected = false;
            if (this.onDisconnected) this.onDisconnected();
          });

          conn.on('error', (err: any) => {
            console.warn('[P2PClient] Connection error:', err);
            reject(err);
          });

          // Lắng nghe cuộc gọi voice audio từ Host
          this.peer.on('call', (mediaConn: any) => {
            try {
              const localStream = voiceEngine.getLocalStream();
              mediaConn.answer(localStream || undefined);
              mediaConn.on('stream', (remoteStream: MediaStream) => {
                voiceEngine.attachRemoteAudio(mediaConn.peer, remoteStream);
              });
            } catch (e) {
              console.warn('[P2PClient] Lỗi nhận voice stream:', e);
            }
          });
        });

        this.peer.on('error', (err: any) => {
          console.warn('[P2PClient] Peer error:', err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public getPeerId(): string | null {
    return this.peer?.id || null;
  }

  /**
   * Khởi tạo cuộc gọi audio tới Host khi Client bật micro
   */
  public callHostAudio(stream: MediaStream) {
    if (!this.peer || !this.isConnected) return;
    try {
      const hostPeerId = `${PEER_PREFIX}${this.roomId.toUpperCase()}`;
      const mediaConn = this.peer.call(hostPeerId, stream);
      if (mediaConn) {
        mediaConn.on('stream', (remoteStream: MediaStream) => {
          voiceEngine.attachRemoteAudio(hostPeerId, remoteStream);
        });
      }
    } catch (err) {
      console.warn('[P2PClient] Không thể gọi voice audio tới Host:', err);
    }
  }

  /**
   * Khởi tạo cuộc gọi audio tới tất cả người chơi khác trong phòng khi Client bật micro
   */
  public callPeersAudio(stream: MediaStream, peerIds: string[]) {
    if (!this.peer || !this.isConnected) return;
    const myId = this.peer.id;
    peerIds.forEach((targetPeerId) => {
      if (!targetPeerId || targetPeerId === myId) return;
      try {
        const mediaConn = this.peer.call(targetPeerId, stream);
        if (mediaConn) {
          mediaConn.on('stream', (remoteStream: MediaStream) => {
            voiceEngine.attachRemoteAudio(targetPeerId, remoteStream);
          });
        }
      } catch (err) {
        console.warn(`[P2PClient] Không thể gọi voice audio tới ${targetPeerId}:`, err);
      }
    });
  }

  public sendAction(playerId: string, actionType: string, data?: any) {
    if (this.conn && this.conn.open) {
      this.conn.send({
        type: 'CLIENT_ACTION',
        roomId: this.roomId,
        senderId: playerId,
        payload: { actionType, data },
      } as P2PMessage);
    }
  }

  public disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    voiceEngine.destroy();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isConnected = false;
  }
}
