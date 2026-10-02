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
   * Kết thúc Đêm -> Tự động tính toán thương vong và chuyển sang Ban Ngày
   */
  public resolveNightToDay(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'NIGHT') return;

    const deadThisNight: string[] = [];
    const { werewolfTargetId, protectedPlayerId, witchSaved, witchPoisonTargetId } = room.nightActions;

    // 1. Xử lý Sói cắn
    if (werewolfTargetId) {
      const isProtected = protectedPlayerId === werewolfTargetId;
      const isSaved = witchSaved;

      if (!isProtected && !isSaved) {
        const victim = room.players.find((p) => p.id === werewolfTargetId);
        if (victim && victim.isAlive) {
          // Bán Sói (Cursed) bị cắn biến thành Sói thay vì chết
          if (victim.role === 'CURSED' && !victim.cursedTurnedWolf) {
            victim.cursedTurnedWolf = true;
            room.historyLog.push(`🐺 Lời nguyền thức tỉnh! Một người chơi bị cắn đã biến thành Ma Sói.`);
          }
          // Già Làng (Elder) có 2 mạng trước đòn cắn của Sói
          else if (victim.role === 'ELDER' && (victim.elderLivesRemaining ?? 2) > 1) {
            victim.elderLivesRemaining = 1;
            room.historyLog.push(`🛡️ Già Làng bị Ma Sói tấn công nhưng kiên cường sống sót!`);
          } else {
            deadThisNight.push(victim.id);
          }
        }
      }
    }

    // 2. Xử lý Thuốc Độc Phù Thủy
    if (witchPoisonTargetId && !deadThisNight.includes(witchPoisonTargetId)) {
      deadThisNight.push(witchPoisonTargetId);
    }

    // 3. Xử lý Cặp Đôi chết chùm
    const coupleVictims: string[] = [];
    deadThisNight.forEach((deadId) => {
      const victim = room.players.find((p) => p.id === deadId);
      if (victim?.isCoupleWith && !deadThisNight.includes(victim.isCoupleWith) && !coupleVictims.includes(victim.isCoupleWith)) {
        coupleVictims.push(victim.isCoupleWith);
      }
    });
    deadThisNight.push(...coupleVictims);

    // Cập nhật người chết
    deadThisNight.forEach((deadId) => {
      const p = room.players.find((player) => player.id === deadId);
      if (p) {
        p.isAlive = false;
        room.historyLog.push(`☠️ ${p.name} (Ghế #${p.seatNumber}) đã hy sinh trong đêm.`);
      }
    });

    if (deadThisNight.length === 0) {
      room.historyLog.push(`✨ Đêm bình yên trôi qua, không có ai hy sinh!`);
    }

    // Kiểm tra điều kiện thắng
    const isGameOver = this.checkWinCondition(room);

    if (!isGameOver) {
      room.phase = 'DAY_DISCUSSION';
      room.timerSeconds = room.settings.discussionTimeSeconds || 60;
      room.historyLog.push(`=== NGÀY THỨ ${room.dayNumber} BẮT ĐẦU: LÀNG THẢO LUẬN ===`);

      // Reset cờ hành động
      room.players.forEach((p) => {
        p.hasActedNight = false;
        p.hasVoted = false;
      });
      room.nightActions = {
        protectedPlayerId: null,
        werewolfTargetId: null,
        witchSaved: false,
        witchPoisonTargetId: null,
        seerTargetId: null,
      };
      room.currentVotes = {};
    }

    this.broadcastState(roomId);
  }

  /**
   * Bắt đầu giai đoạn Bỏ Phiếu ban ngày
   */
  public startDayVoting(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DAY_DISCUSSION') return;

    room.phase = 'DAY_VOTING';
    room.timerSeconds = room.settings.votingTimeSeconds || 30;
    room.currentVotes = {};
    room.historyLog.push(`⚖️ Giai đoạn bỏ phiếu treo cổ bắt đầu!`);

    this.broadcastState(roomId);
  }

  /**
   * Bỏ phiếu treo cổ
   */
  public castVote(roomId: string, voterId: string, targetId: string | null): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DAY_VOTING') return;

    const voter = room.players.find((p) => p.id === voterId);
    if (!voter || !voter.isAlive) return;

    // Kẻ Ngốc đã lật bài thì mất quyền bỏ phiếu
    if (voter.role === 'IDIOT' && voter.idiotRevealed) {
      throw new Error('Kẻ Ngốc đã lật bài bị tước quyền bỏ phiếu.');
    }

    room.currentVotes[voterId] = targetId;
    voter.hasVoted = true;

    // Nếu tất cả người sống đã bỏ phiếu -> tự động kết thúc vote
    const livingVoters = room.players.filter((p) => p.isAlive && !(p.role === 'IDIOT' && p.idiotRevealed));
    const allVoted = livingVoters.every((p) => p.hasVoted);

    if (allVoted) {
      this.concludeDayVoting(roomId);
      return;
    }

    this.broadcastState(roomId);
  }

  /**
   * Tổng kết phiếu bầu & Treo cổ
   */
  public concludeDayVoting(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DAY_VOTING') return;

    const voteCounts: Record<string, number> = {};
    Object.values(room.currentVotes).forEach((targetId) => {
      if (targetId) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });

    let highestTargetId: string | null = null;
    let highestCount = 0;
    let isTie = false;

    Object.entries(voteCounts).forEach(([targetId, count]) => {
      if (count > highestCount) {
        highestCount = count;
        highestTargetId = targetId;
        isTie = false;
      } else if (count === highestCount) {
        isTie = true;
      }
    });

    if (highestTargetId && !isTie && highestCount > 0) {
      const victim = room.players.find((p) => p.id === highestTargetId);
      if (victim && victim.isAlive) {
        // Kẻ Ngốc lật bài thoát chết treo cổ
        if (victim.role === 'IDIOT' && !victim.idiotRevealed) {
          victim.idiotRevealed = true;
          room.historyLog.push(`🃏 ${victim.name} là Kẻ Ngốc! Lật bài công khai và được tha chết, nhưng mất quyền vote.`);
        } else {
          victim.isAlive = false;
          room.historyLog.push(`🪢 Làng đã quyết định xử tử ${victim.name} (${highestCount} phiếu).`);

          // Nếu có người yêu thì chết theo
          if (victim.isCoupleWith) {
            const partner = room.players.find((p) => p.id === victim.isCoupleWith);
            if (partner && partner.isAlive) {
              partner.isAlive = false;
              room.historyLog.push(`💔 ${partner.name} vì quá đau thương đã tuẫn tiết chết theo người yêu.`);
            }
          }
        }
      }
    } else {
      room.historyLog.push(`🕊️ Số phiếu hòa hoặc bỏ trắng. Không ai bị treo cổ hôm nay.`);
    }

    // Kiểm tra điều kiện thắng
    const isGameOver = this.checkWinCondition(room);

    if (!isGameOver) {
      // Chuyển sang Đêm kế tiếp
      room.phase = 'NIGHT';
      room.dayNumber += 1;
      room.timerSeconds = 45;
      room.historyLog.push(`=== ĐÊM THỨ ${room.dayNumber} BUÔNG XUỐNG ===`);

      room.players.forEach((p) => {
        p.hasActedNight = false;
        p.hasVoted = false;
      });
      room.currentVotes = {};
    }

    this.broadcastState(roomId);
  }

  /**
   * Kiểm tra điều kiện thắng thua của ván đấu
   */
  public checkWinCondition(room: ServerGameState): boolean {
    const livingPlayers = room.players.filter((p) => p.isAlive);
    const livingWolves = livingPlayers.filter(
      (p) => p.role === 'WEREWOLF' || (p.role === 'CURSED' && p.cursedTurnedWolf)
    );
    const livingVillagers = livingPlayers.filter(
      (p) => p.role !== 'WEREWOLF' && !(p.role === 'CURSED' && p.cursedTurnedWolf)
    );

    // Kiểm tra cặp đôi khác phe sống sót cuối cùng
    if (livingPlayers.length === 2 && livingPlayers[0].isCoupleWith === livingPlayers[1].id) {
      const isDifferentTeam =
        (livingPlayers[0].role === 'WEREWOLF' && livingPlayers[1].role !== 'WEREWOLF') ||
        (livingPlayers[1].role === 'WEREWOLF' && livingPlayers[0].role !== 'WEREWOLF');

      if (isDifferentTeam) {
        room.phase = 'GAME_OVER';
        room.winner = 'LOVERS';
        room.historyLog.push(`💘 CẶP ĐÔI KHÁC PHE SỐNG SÓT CUỐI CÙNG — CẶP ĐÔI CHIẾN THẮNG!`);
        return true;
      }
    }

    // Dân làng thắng: Sói chết hết
    if (livingWolves.length === 0) {
      room.phase = 'GAME_OVER';
      room.winner = 'VILLAGERS';
      room.historyLog.push(`🎉 TOÀN BỘ MA SÓI ĐÃ BỊ TIÊU DIỆT — PHE DÂN LÀNG CHIẾN THẮNG!`);
      return true;
    }

    // Ma sói thắng: Số Sói >= Số Dân
    if (livingWolves.length >= livingVillagers.length) {
      room.phase = 'GAME_OVER';
      room.winner = 'WEREWOLVES';
      room.historyLog.push(`🐺 SỐ LƯỢNG MA SÓI ĐÃ ÁP ĐẢO DÂN LÀNG — PHE MA SÓI CHIẾN THẮNG!`);
      return true;
    }

    return false;
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
