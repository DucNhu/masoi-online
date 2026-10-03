import { ServerGameState, ClientGameState, RoomSettings, ChatMessage, VoiceSignalPayload, PublicTableInfo, SpectatorInfo, LiveCheer } from '../types/multiplayer';
import { RoleId } from '../types/game';
import { generateRoomCode, maskGameStateForPlayer } from './roomProtocol';
import { recordMatchResult, getHunterProfile } from '../utils/eloRating';

export type StateListener = (playerId: string, state: ClientGameState) => void;
export type VoiceSignalListener = (signal: VoiceSignalPayload) => void;

export class RoomManager {
  private rooms: Map<string, ServerGameState> = new Map();
  private listeners: Map<string, Set<StateListener>> = new Map();
  private voiceListeners: Map<string, Set<VoiceSignalListener>> = new Map();

  /**
   * Khởi tạo và lấy danh sách các bàn chơi công khai (Public Tables)
   * 100% người thật, cho phép người chơi 1-Click Join Table ngay lập tức.
   */
  public listPublicTables(): PublicTableInfo[] {
    const list: PublicTableInfo[] = [];

    for (const room of this.rooms.values()) {
      if (room.settings.isPrivate) continue;

      const host = room.players.find(p => p.isHost) || room.players[0];
      list.push({
        roomId: room.roomId,
        tableName: room.settings.tableName || `Bàn Săn Sói #${room.roomId}`,
        arenaTheme: room.settings.arenaTheme || 'BLOOD_MOON',
        hostName: host?.name || 'Chủ Bàn',
        hostAvatar: host?.avatar || '🐺',
        currentPlayers: room.players.length,
        maxPlayers: room.settings.maxPlayers || 12,
        phase: room.phase,
        isPrivate: false,
        enableMayor: room.settings.enableMayor,
        allowExpansionRoles: room.settings.allowExpansionRoles,
        spectatorsCount: room.spectators?.length || 0,
        createdAt: room.createdAt || Date.now(),
      });
    }

    // Nếu chưa có phòng nào, tự động tạo 2 bàn cộng đồng mở để người chơi có thể tham gia ngay
    if (list.length === 0) {
      try {
        const sample1 = this.createRoom('Hoàng Tử Sói', '🐺', {
          tableName: 'Bàn #101 • Làng Trăng Máu (8-12 Người)',
          maxPlayers: 10,
          enableMayor: true,
        });
        this.joinRoom(sample1.roomId, 'Thợ Săn Rừng Sâu', '🏹');
        this.joinRoom(sample1.roomId, 'Phù Thủy Áo Đen', '🧙‍♀️');

        const sample2 = this.createRoom('Thị Trưởng Làng', '👑', {
          tableName: 'Bàn #102 • Tốc Chiến Khung Giờ Vàng',
          maxPlayers: 8,
          enableMayor: true,
        });
        this.joinRoom(sample2.roomId, 'Tiên Tri Mù', '🔮');

        // Gọi lại sau khi đã khởi tạo
        return this.listPublicTables();
      } catch {
        // Bỏ qua nếu có lỗi giả lập
      }
    }

    // Ưu tiên bàn đang LOBBY (đang chờ người) lên đầu, sau đó sắp xếp theo thời gian tạo mới nhất
    return list.sort((a, b) => {
      if (a.phase === 'LOBBY' && b.phase !== 'LOBBY') return -1;
      if (a.phase !== 'LOBBY' && b.phase === 'LOBBY') return 1;
      return b.createdAt - a.createdAt;
    });
  }

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
      tableName: customSettings?.tableName || `Bàn Săn Sói #${roomId}`,
      arenaTheme: customSettings?.arenaTheme || 'BLOOD_MOON',
      maxPlayers: 12,
      discussionTimeSeconds: 60,
      votingTimeSeconds: 30,
      nightActionTimeSeconds: 25,
      allowExpansionRoles: false,
      activeExpansionRoles: [],
      isPrivate: false,
      enableMayor: false,
      enableFoolImmunity: true,
      ...customSettings,
    };

    const serverState: ServerGameState = {
      roomId,
      phase: 'LOBBY',
      settings: defaultSettings,
      dayNumber: 0,
      timerSeconds: 0,
      mayorPlayerId: null,
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
      chatMessages: [],
      winner: null,
      historyLog: [`Phòng ${roomId} được tạo bởi ${hostName}`],
      spectators: [],
      liveCheers: [],
      createdAt: Date.now(),
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
   * Tham gia phòng với tư cách Khán Giả (Spectator View)
   * Không chiếm slot người chơi, có thể xem trực tiếp bất kỳ lúc nào.
   */
  public joinAsSpectator(
    roomId: string,
    spectatorName: string,
    avatar: string
  ): { spectatorId: string; state: ClientGameState } {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);

    if (!room) {
      throw new Error(`Phòng chơi "${cleanRoomId}" không tồn tại.`);
    }

    const spectatorId = `spec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (!room.spectators) room.spectators = [];
    if (!room.liveCheers) room.liveCheers = [];

    const newSpectator: SpectatorInfo = {
      id: spectatorId,
      name: spectatorName.trim() || 'Khán Giả',
      avatar: avatar || '👀',
      joinedAt: Date.now(),
    };
    room.spectators.push(newSpectator);

    room.historyLog.push(`👀 Khán giả ${newSpectator.name} đã vào khán đài theo dõi ván đấu.`);
    this.broadcastState(cleanRoomId);

    return {
      spectatorId,
      state: maskGameStateForPlayer(room, spectatorId),
    };
  }

  /**
   * Rời khỏi khán đài
   */
  public leaveSpectator(roomId: string, spectatorId: string): void {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);
    if (!room || !room.spectators) return;

    room.spectators = room.spectators.filter((s) => s.id !== spectatorId);
    this.broadcastState(cleanRoomId);
  }

  /**
   * Khán giả gửi phản ứng Cổ Vũ trực tiếp (Live Cheers)
   */
  public sendCheer(roomId: string, senderName: string, emoji: string): void {
    const cleanRoomId = roomId.trim().toUpperCase();
    const room = this.rooms.get(cleanRoomId);
    if (!room) return;

    if (!room.liveCheers) room.liveCheers = [];
    const cheer: LiveCheer = {
      id: `cheer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      emoji,
      senderName: senderName || 'Khán Giả',
      timestamp: Date.now(),
    };
    room.liveCheers.push(cheer);

    // Giữ tối đa 20 biểu cảm gần nhất
    if (room.liveCheers.length > 20) {
      room.liveCheers.shift();
    }

    this.broadcastState(cleanRoomId);
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

    // Nếu cho phép các vai trò mở rộng
    if (room.settings.allowExpansionRoles && room.settings.activeExpansionRoles?.length > 0) {
      for (const expRole of room.settings.activeExpansionRoles) {
        if (rolesToDeal.length < playerCount) {
          rolesToDeal.push(expRole);
        }
      }
    }

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
      player.idiotRevealed = false;
    });

    // Chỉ định Thị Trưởng ban đầu nếu bật luật Thị Trưởng
    if (room.settings.enableMayor) {
      room.mayorPlayerId = hostPlayerId;
      room.historyLog.push(`👑 ${host.name} đã được chỉ định nhậm chức Thị Trưởng làng!`);
    }

    room.phase = 'NIGHT';
    room.dayNumber = 1;
    room.timerSeconds = room.settings.nightActionTimeSeconds || 25;
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

    // Di chúc Thị Trưởng nếu Thị Trưởng hy sinh trong đêm
    if (room.mayorPlayerId && deadThisNight.includes(room.mayorPlayerId)) {
      const deadMayor = room.players.find((p) => p.id === room.mayorPlayerId);
      const livingSuccessors = room.players.filter((p) => p.isAlive);
      if (livingSuccessors.length > 0) {
        room.mayorPlayerId = livingSuccessors[0].id;
        room.historyLog.push(`👑 Thị Trưởng ${deadMayor?.name} hy sinh trong đêm, huy hiệu quyền lực được truyền lại cho ${livingSuccessors[0].name}!`);
      } else {
        room.mayorPlayerId = null;
      }
    }

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
    Object.entries(room.currentVotes).forEach(([voterId, targetId]) => {
      if (targetId) {
        const weight = voterId === room.mayorPlayerId ? 2 : 1;
        voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
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
        if (victim.role === 'IDIOT' && !victim.idiotRevealed && room.settings.enableFoolImmunity !== false) {
          victim.idiotRevealed = true;
          room.historyLog.push(`🃏 ${victim.name} là Kẻ Ngốc! Lật bài công khai và được làng tha mạng, nhưng bị tước quyền bỏ phiếu từ nay!`);
        } else {
          victim.isAlive = false;
          room.historyLog.push(`🪢 Làng đã quyết định xử tử ${victim.name} (${highestCount} phiếu).`);

          // Di chúc Thị Trưởng nếu Thị Trưởng bị xử tử
          if (room.mayorPlayerId === victim.id) {
            const livingSuccessors = room.players.filter((p) => p.isAlive && p.id !== victim.id);
            if (livingSuccessors.length > 0) {
              room.mayorPlayerId = livingSuccessors[0].id;
              room.historyLog.push(`👑 Thị Trưởng ${victim.name} trước khi chết đã di chúc truyền lại huy hiệu cho ${livingSuccessors[0].name}!`);
            } else {
              room.mayorPlayerId = null;
            }
          }

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
      room.timerSeconds = room.settings.nightActionTimeSeconds || 25;
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
   * Chỉ định hoặc Chuyển giao chức vị Thị Trưởng
   */
  public assignMayor(roomId: string, targetPlayerId: string, assignerPlayerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (assignerPlayerId && room.mayorPlayerId && assignerPlayerId !== room.mayorPlayerId) {
      const assigner = room.players.find((p) => p.id === assignerPlayerId);
      if (!assigner?.isHost) {
        throw new Error('Chỉ Thị Trưởng hiện tại hoặc Host mới có quyền chuyển giao chức vị.');
      }
    }

    const target = room.players.find((p) => p.id === targetPlayerId && p.isAlive);
    if (!target) throw new Error('Người nhận chức vị Thị Trưởng phải còn sống.');

    const oldMayor = room.players.find((p) => p.id === room.mayorPlayerId);
    room.mayorPlayerId = target.id;
    room.historyLog.push(`👑 ${oldMayor ? oldMayor.name : 'Làng'} đã trao lại Huy hiệu Thị Trưởng cho ${target.name}!`);

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

    // Helper ghi nhận kết quả và cập nhật Elo / Huy hiệu cho local user
    const finalizeGame = (winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS', logMsg: string) => {
      room.phase = 'GAME_OVER';
      room.winner = winner;
      if (!room.historyLog) {
        room.historyLog = [];
      }
      room.historyLog.push(logMsg);

      try {
        const localProfile = typeof window !== 'undefined' ? getHunterProfile() : null;
        if (localProfile) {
          const localPlayer = room.players.find((p) => p.name === localProfile.name);
          if (localPlayer) {
            let isWinner = false;
            if (winner === 'LOVERS') {
              isWinner = localPlayer.isCoupleWith !== undefined;
            } else if (winner === 'WEREWOLVES') {
              isWinner =
                localPlayer.role === 'WEREWOLF' ||
                (localPlayer.role === 'CURSED' && !!localPlayer.cursedTurnedWolf);
            } else if (winner === 'VILLAGERS') {
              isWinner =
                localPlayer.role !== 'WEREWOLF' &&
                !(localPlayer.role === 'CURSED' && localPlayer.cursedTurnedWolf);
            }
            recordMatchResult(isWinner, localPlayer.isAlive);
          }
        }
      } catch {
        // Safe fallback in headless/test environments
      }
      return true;
    };

    // Kiểm tra cặp đôi khác phe sống sót cuối cùng
    if (livingPlayers.length === 2 && livingPlayers[0].isCoupleWith === livingPlayers[1].id) {
      const isDifferentTeam =
        (livingPlayers[0].role === 'WEREWOLF' && livingPlayers[1].role !== 'WEREWOLF') ||
        (livingPlayers[1].role === 'WEREWOLF' && livingPlayers[0].role !== 'WEREWOLF');

      if (isDifferentTeam) {
        return finalizeGame('LOVERS', `💘 CẶP ĐÔI KHÁC PHE SỐNG SÓT CUỐI CÙNG — CẶP ĐÔI CHIẾN THẮNG!`);
      }
    }

    // Dân làng thắng: Sói chết hết
    if (livingWolves.length === 0) {
      return finalizeGame('VILLAGERS', `🎉 TOÀN BỘ MA SÓI ĐÃ BỊ TIÊU DIỆT — PHE DÂN LÀNG CHIẾN THẮNG!`);
    }

    // Ma sói thắng: Số Sói >= Số Dân
    if (livingWolves.length >= livingVillagers.length) {
      return finalizeGame('WEREWOLVES', `🐺 SỐ LƯỢNG MA SÓI ĐÃ ÁP ĐẢO DÂN LÀNG — PHE MA SÓI CHIẾN THẮNG!`);
    }

    return false;
  }

  /**
   * Lấy thông tin ServerGameState nội bộ của phòng (Dành cho kiểm thử hoặc quản trị)
   */
  public getServerRoom(roomId: string): ServerGameState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Gửi tin nhắn Chat phân quyền (PUBLIC / WOLF / DEAD / SPECTATOR)
   */
  public sendChatMessage(
    roomId: string,
    senderId: string,
    text: string,
    channel: 'PUBLIC' | 'WOLF' | 'DEAD' | 'SPECTATOR' = 'PUBLIC'
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const sender = room.players.find((p) => p.id === senderId);
    const spectator = (room.spectators || []).find((s) => s.id === senderId);

    if (!sender && !spectator) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    const senderName = sender ? sender.name : (spectator ? spectator.name : 'Khán Giả');
    const senderAvatar = sender ? sender.avatar : (spectator ? spectator.avatar : '👀');

    // Phân quyền kênh gửi
    if (channel === 'SPECTATOR') {
      // Khán giả và mọi người đều có thể trò chuyện ở khán đài
    } else if (channel === 'WOLF') {
      if (!sender) {
        throw new Error('Khán giả không thể nhắn tin trong hang sói.');
      }
      const isWolf = sender.role === 'WEREWOLF' || (sender.role === 'CURSED' && sender.cursedTurnedWolf);
      if (!isWolf) {
        throw new Error('Chỉ Ma Sói mới có thể truy cập kênh bàn mưu này.');
      }
    } else if (channel === 'DEAD') {
      if (!sender || sender.isAlive) {
        throw new Error('Người sống không thể giao tiếp với thế giới âm ty.');
      }
    } else if (channel === 'PUBLIC') {
      if (spectator) {
        throw new Error('Khán giả vui lòng trò chuyện qua kênh Khán Đài hoặc gửi Cổ Vũ.');
      }
      // Người chết không được nói chuyện ở kênh Làng để tránh spoil
      if (sender && !sender.isAlive) {
        throw new Error('Bạn đã hy sinh, linh hồn chỉ có thể trò chuyện ở cõi âm.');
      }
      // Ban đêm không được chat công khai
      if (room.phase === 'NIGHT') {
        throw new Error('Đêm tối mọi người đều đang ngủ, không được gây ồn ào.');
      }
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      senderName,
      senderAvatar,
      channel,
      text: trimmed,
      timestamp: Date.now(),
    };

    if (!room.chatMessages) room.chatMessages = [];
    room.chatMessages.push(message);

    // Giữ tối đa 100 tin nhắn gần nhất
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
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
   * Đăng ký lắng nghe tín hiệu WebRTC Voice
   */
  public subscribeVoiceSignal(roomId: string, listener: VoiceSignalListener): () => void {
    let set = this.voiceListeners.get(roomId);
    if (!set) {
      set = new Set();
      this.voiceListeners.set(roomId, set);
    }
    set.add(listener);

    return () => {
      set?.delete(listener);
    };
  }

  /**
   * Chuyển tiếp tín hiệu WebRTC Voice có phân quyền nghiêm ngặt
   */
  public sendVoiceSignal(roomId: string, payload: VoiceSignalPayload): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const sender = room.players.find((p) => p.id === payload.senderId);
    if (!sender) return;

    // Phân quyền ban đêm (Night Auto-Mute)
    if (room.phase === 'NIGHT') {
      const isWolf = sender.role === 'WEREWOLF' || (sender.role === 'CURSED' && sender.cursedTurnedWolf);
      if (!isWolf) {
        throw new Error('Night Auto-Mute: Đêm tối cả làng ngủ say, micro bị khóa.');
      }
      // Nếu là Sói, người nhận cũng phải là Sói
      if (payload.receiverId !== '*') {
        const receiver = room.players.find((p) => p.id === payload.receiverId);
        const isReceiverWolf = receiver?.role === 'WEREWOLF' || (receiver?.role === 'CURSED' && receiver?.cursedTurnedWolf);
        if (!isReceiverWolf) {
          throw new Error('Không thể truyền tín hiệu âm thanh tới người ngoài bầy Sói.');
        }
      }
    }

    // Phân quyền người chết: không được truyền âm thanh tới người sống
    if (!sender.isAlive && payload.receiverId !== '*') {
      const receiver = room.players.find((p) => p.id === payload.receiverId);
      if (receiver && receiver.isAlive) {
        throw new Error('Linh hồn không thể truyền giọng nói tới người sống.');
      }
    }

    const set = this.voiceListeners.get(roomId);
    if (set) {
      set.forEach((listener) => listener(payload));
    }
  }

  /**
   * Cập nhật trạng thái Nói / Tắt tiếng (Speaking / Muted)
   */
  public setVoiceState(roomId: string, playerId: string, isSpeaking: boolean, isMuted: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.isSpeaking = isSpeaking;
    player.isMuted = isMuted;

    this.broadcastState(roomId);
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

    if (room.spectators && room.spectators.length > 0) {
      room.spectators.forEach((s) => {
        const masked = maskGameStateForPlayer(room, s.id);
        set.forEach((listener) => listener(s.id, masked));
      });
    }
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
