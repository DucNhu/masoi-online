import { ServerGameState, ClientGameState, RoomSettings } from '../types/multiplayer';
import { RoleId } from '../types/game';
import { generateRoomCode, maskGameStateForPlayer } from './roomProtocol';

export type StateListener = (playerId: string, state: ClientGameState) => void;

export class RoomManager {
  private rooms: Map<string, ServerGameState> = new Map();
  private listeners: Map<string, Set<StateListener>> = new Map();

  /**
   * Tạo phòng mới với Host
   */
  public createRoom(
    hostName: string,
    avatar: string,
    customSettings?: Partial<RoomSettings>
  ): { roomId: string; sessionToken: string; playerId: string; state: ClientGameState } {
    const roomId = generateRoomCode();
    const hostId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionToken = `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    const defaultSettings: RoomSettings = {
      maxPlayers: 12,
      discussionTimeSeconds: 60,
      votingTimeSeconds: 30,
      allowExpansionRoles: false,
      activeExpansionRoles: [],
      isPrivate: false,
      ...customSettings,
    };

    const serverState: ServerGameState = {
      roomId,
      phase: 'LOBBY',
      settings: defaultSettings,
      dayNumber: 0,
      timerSeconds: 0,
      players: [
        {
          id: hostId,
          name: hostName,
          avatar: avatar || '🐺',
          isHost: true,
          isReady: true,
          isAlive: true,
          seatNumber: 1,
          hasVoted: false,
          hasActedNight: false,
          role: 'VILLAGER', // Tạm thời trong lobby
          sessionToken,
        },
      ],
      nightActions: {
        protectedPlayerId: null,
        werewolfTargetId: null,
        witchSaved: false,
        witchPoisonTargetId: null,
        seerTargetId: null,
      },
      seerHistory: {},
      currentVotes: {},
      winner: null,
      historyLog: [`Phòng ${roomId} được tạo bởi ${hostName}`],
    };

    this.rooms.set(roomId, serverState);
    this.listeners.set(roomId, new Set());

    const clientState = maskGameStateForPlayer(serverState, hostId);
    return { roomId, sessionToken, playerId: hostId, state: clientState };
  }

  /**
   * Tham gia phòng chơi bằng mã phòng
   */
  public joinRoom(
    roomId: string,
    playerName: string,
    avatar: string
  ): { sessionToken: string; playerId: string; state: ClientGameState } {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      throw new Error(`Phòng chơi "${cleanRoomId}" không tồn tại.`);
    }

    if (room.phase !== 'LOBBY') {
      throw new Error('Ván đấu trong phòng đã bắt đầu, không thể tham gia.');
    }

    if (room.players.length >= 15) {
      throw new Error('Phòng chơi đã đạt tối đa số lượng người.');
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionToken = `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    const seatNumber = room.players.length + 1;

    room.players.push({
      id: playerId,
      name: playerName,
      avatar: avatar || '👤',
      isHost: false,
      isReady: false,
      isAlive: true,
      seatNumber,
      hasVoted: false,
      hasActedNight: false,
      role: 'VILLAGER',
      sessionToken,
    });

    room.historyLog.push(`${playerName} đã vào phòng (Ghế số ${seatNumber})`);
    this.broadcastState(cleanRoomId);

    return {
      sessionToken,
      playerId,
      state: maskGameStateForPlayer(room, playerId),
    };
  }

  /**
   * Tự động khôi phục kết nối qua Session Token
   */
  public reconnect(
    roomId: string,
    sessionToken: string
  ): { playerId: string; state: ClientGameState } {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      throw new Error(`Phòng chơi "${cleanRoomId}" không tồn tại.`);
    }

    const player = room.players.find((p) => p.sessionToken === sessionToken);
    if (!player) {
      throw new Error('Token phiên làm việc không hợp lệ hoặc đã hết hạn.');
    }

    return {
      playerId: player.id,
      state: maskGameStateForPlayer(room, player.id),
    };
  }

  /**
   * Sẵn sàng / Hủy sẵn sàng
   */
  public toggleReady(roomId: string, playerId: string, isReady: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'LOBBY') return;

    const player = room.players.find((p) => p.id === playerId);
    if (player && !player.isHost) {
      player.isReady = isReady;
      this.broadcastState(roomId);
    }
  }

  /**
   * Bắt đầu ván đấu & Chia vai trò ngẫu nhiên
   */
  public startGame(roomId: string, hostPlayerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Phòng không tồn tại');

    const host = room.players.find((p) => p.id === hostPlayerId);
    if (!host || !host.isHost) {
      throw new Error('Chỉ có Chủ phòng (Host) mới có quyền bắt đầu ván đấu.');
    }

    const playerCount = room.players.length;
    if (playerCount < 4) {
      throw new Error('Cần tối thiểu 4 người chơi để bắt đầu ván đấu Ma Sói.');
    }

    // 1. Phân bổ vai trò cân bằng
    const rolesToDeal: RoleId[] = [];
    const wolfCount = Math.max(1, Math.floor(playerCount / 3));

    for (let i = 0; i < wolfCount; i++) rolesToDeal.push('WEREWOLF');
    rolesToDeal.push('SEER');
    rolesToDeal.push('BODYGUARD');
    if (playerCount >= 6) rolesToDeal.push('WITCH');
    if (playerCount >= 8) rolesToDeal.push('HUNTER');

    // Các vị trí còn lại là Dân Làng
    while (rolesToDeal.length < playerCount) {
      rolesToDeal.push('VILLAGER');
    }

    // Shuffle Fischer-Yates
    for (let i = rolesToDeal.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolesToDeal[i], rolesToDeal[j]] = [rolesToDeal[j], rolesToDeal[i]];
    }

    // Gán vai trò cho từng người chơi
    room.players.forEach((player, idx) => {
      player.role = rolesToDeal[idx];
      player.isAlive = true;
      player.hasActedNight = false;
      player.hasVoted = false;
    });

    room.phase = 'NIGHT';
    room.dayNumber = 1;
    room.timerSeconds = 45;
    room.historyLog.push(`=== ĐÊM THỨ 1 BẮT ĐẦU ===`);

    this.broadcastState(roomId);
  }

  /**
   * Gửi hành động đêm
   */
  public submitNightAction(
    roomId: string,
    playerId: string,
    action: { actionType: string; targetId?: string; targetId2?: string }
  ): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'NIGHT') return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isAlive) return;

    if (action.actionType === 'WEREWOLF_KILL' && player.role === 'WEREWOLF') {
      room.nightActions.werewolfTargetId = action.targetId || null;
      player.hasActedNight = true;
    } else if (action.actionType === 'SEER_SCAN' && player.role === 'SEER') {
      if (action.targetId) {
        const target = room.players.find((p) => p.id === action.targetId);
        const isWolf = target?.role === 'WEREWOLF' || (target?.role === 'CURSED' && target.cursedTurnedWolf);
        room.seerHistory[playerId] = { targetId: action.targetId, isWolf: Boolean(isWolf) };
        room.nightActions.seerTargetId = action.targetId;
        player.hasActedNight = true;
      }
    } else if (action.actionType === 'PROTECT' && player.role === 'BODYGUARD') {
      room.nightActions.protectedPlayerId = action.targetId || null;
      player.hasActedNight = true;
    }

    this.broadcastState(roomId);
  }

  /**
   * Đăng ký lắng nghe thay đổi trạng thái theo phòng
   */
  public subscribe(roomId: string, listener: StateListener): () => void {
    let set = this.listeners.get(roomId);
    if (!set) {
      set = new Set();
      this.listeners.set(roomId, set);
    }
    set.add(listener);

    return () => {
      set?.delete(listener);
    };
  }

  /**
   * Broadcast masked state riêng cho từng người chơi trong phòng
   */
  private broadcastState(roomId: string): void {
    const room = this.rooms.get(roomId);
    const set = this.listeners.get(roomId);
    if (!room || !set || set.size === 0) return;

    room.players.forEach((p) => {
      const masked = maskGameStateForPlayer(room, p.id);
      set.forEach((listener) => listener(p.id, masked));
    });
  }

  /**
   * Lấy masked state cho 1 player
   */
  public getMaskedState(roomId: string, playerId: string): ClientGameState {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Phòng không tồn tại');
    return maskGameStateForPlayer(room, playerId);
  }
}

// Khởi tạo Singleton instance
export const roomManager = new RoomManager();
