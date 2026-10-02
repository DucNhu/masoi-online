import { ServerGameState, ClientGameState, NetworkPlayer } from '../types/multiplayer';
import { RoleId } from '../types/game';

// Ký tự tạo mã phòng loại bỏ 0, O, 1, I để tránh nhầm lẫn khi đọc qua voice chat
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Tạo mã phòng ngẫu nhiên 6 ký tự
 * Ví dụ: "WOLF88", "K6M9PQ"
 */
export function generateRoomCode(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    result += ROOM_CODE_ALPHABET[randomIndex];
  }
  return result;
}

/**
 * Kiểm tra tính hợp lệ của mã phòng
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  if (clean.length !== 6) return false;
  return clean.split('').every((char) => ROOM_CODE_ALPHABET.includes(char));
}

/**
 * BỘ LỌC AN TOÀN TUYỆT ĐỐI — ZERO-KNOWLEDGE PAYLOAD MASKING
 * 
 * Che giấu toàn bộ vai trò và dữ liệu nhạy cảm của người chơi khác.
 * Chỉ trả về những gì mà playerId cụ thể có quyền hợp pháp được biết.
 */
export function maskGameStateForPlayer(
  serverState: ServerGameState,
  playerId: string
): ClientGameState {
  const me = serverState.players.find((p) => p.id === playerId);
  if (!me) {
    throw new Error(`Người chơi với ID ${playerId} không tồn tại trong phòng`);
  }

  const myRole = me.role;

  // 1. Mask danh sách người chơi (xóa vai trò, lá bài, token bảo mật)
  const maskedPlayers: NetworkPlayer[] = serverState.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    isReady: p.isReady,
    isAlive: p.isAlive,
    seatNumber: p.seatNumber,
    hasVoted: p.hasVoted,
    hasActedNight: p.hasActedNight,
  }));

  // 2. Tính toán danh sách đồng đội Sói (chỉ mở cho Ma Sói hoặc Kẻ Bán Tơ)
  const teamMates: string[] = [];
  const isWolfSide = myRole === 'WEREWOLF' || myRole === 'MINION' || (myRole === 'CURSED' && me.cursedTurnedWolf);

  if (isWolfSide) {
    serverState.players.forEach((p) => {
      const isPlayerWolf = p.role === 'WEREWOLF' || (p.role === 'CURSED' && p.cursedTurnedWolf);
      if (isPlayerWolf && p.id !== playerId) {
        teamMates.push(p.id);
      }
    });
  }

  // 3. Tính toán thông tin Người Yêu (nếu là cặp đôi của Cupid)
  const couplePartnerId = me.isCoupleWith;

  // 4. Kết quả soi của Tiên Tri
  const seerScanResult = serverState.seerHistory[playerId];

  // 5. Danh sách các vai trò đã lộ diện hợp pháp (ví dụ: Kẻ Ngốc bị lật bài khi vote treo cổ)
  const revealedRoles: Record<string, RoleId> = {};
  serverState.players.forEach((p) => {
    if (p.idiotRevealed) {
      revealedRoles[p.id] = 'IDIOT';
    }
    // Nếu ván đấu kết thúc thì công khai toàn bộ vai trò
    if (serverState.phase === 'GAME_OVER') {
      revealedRoles[p.id] = p.role;
    }
  });

  // 6. Tính tổng số phiếu công khai khi đang ở pha Bỏ Phiếu DAY_VOTING
  let voteTally: Record<string, number> | undefined;
  if (serverState.phase === 'DAY_VOTING') {
    voteTally = {};
    Object.values(serverState.currentVotes).forEach((targetId) => {
      if (targetId) {
        voteTally![targetId] = (voteTally![targetId] || 0) + 1;
      }
    });
  }
  const myVote = serverState.currentVotes[playerId] ?? null;

  // 7. Lọc Chat Messages theo phân quyền nghiêm ngặt
  const filteredChat = (serverState.chatMessages || []).filter((msg) => {
    if (msg.channel === 'PUBLIC') return true;
    if (msg.channel === 'WOLF') return isWolfSide;
    if (msg.channel === 'DEAD') return !me.isAlive;
    return false;
  });

  return {
    roomId: serverState.roomId,
    phase: serverState.phase,
    subPhase: serverState.subPhase,
    dayNumber: serverState.dayNumber,
    timerSeconds: serverState.timerSeconds,
    players: maskedPlayers,
    myPlayerId: playerId,
    myRole: myRole,
    myCard: me.card,
    revealedRoles,
    teamMates,
    couplePartnerId,
    seerScanResult,
    voteTally,
    myVote,
    chatMessages: filteredChat,
    historyLog: serverState.historyLog,
    winner: serverState.winner,
  };
}
