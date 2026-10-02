import { GameState, Player, WinConditionResult, RoundLog } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';

const STORAGE_KEY = 'MA_SOI_OFFLINE_GAME_STATE_V1';

export function saveGameStateToStorage(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state to localStorage', err);
  }
}

export function loadGameStateFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (err) {
    console.error('Failed to load game state from localStorage', err);
    return null;
  }
}

export function clearGameStateStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear game state from localStorage', err);
  }
}

export interface NightResolutionOutcome {
  deadPlayerIds: string[];
  deathReasons: Record<string, string>;
  hunterTriggeredId: string | null;
  summaryLogs: string[];
}

/**
 * Tính toán kết quả thương vong sau một đêm
 */
export function resolveNightActions(state: GameState): NightResolutionOutcome {
  const { currentNightAction, lastProtectedPlayerId: _lastProt, players, lovers } = state;
  const deadPlayerIds: string[] = [];
  const deathReasons: Record<string, string> = {};
  const summaryLogs: string[] = [];

  const werewolfTarget = currentNightAction.werewolfTargetId;
  const protectedTarget = currentNightAction.protectedPlayerId;
  const witchSaved = currentNightAction.witchSaved;
  const witchPoisonTarget = currentNightAction.witchPoisonTargetId;

  // 1. Xử lý nạn nhân bị Sói cắn
  if (werewolfTarget) {
    const victim = players.find(p => p.id === werewolfTarget);
    const victimName = victim ? `${victim.name} (Ghế ${victim.seatNumber})` : 'Một người';

    if (protectedTarget === werewolfTarget) {
      summaryLogs.push(`🛡️ Sói cắn ${victimName}, nhưng đã được Bảo Vệ che chắn kịp thời!`);
    } else if (witchSaved) {
      summaryLogs.push(`🧪 Sói cắn ${victimName}, nhưng Phù Thủy đã dùng Bình Cứu hồi sinh!`);
    } else if (victim && victim.roleId === 'ELDER' && (victim.elderLivesRemaining === undefined || victim.elderLivesRemaining > 1)) {
      victim.elderLivesRemaining = 1;
      summaryLogs.push(`🛡️ Già Làng ${victimName} bị Ma Sói cắn nhưng đã kiên cường sống sót nhờ sinh mệnh thứ 2! (Còn 1 mạng).`);
    } else if (victim && victim.roleId === 'CURSED' && !victim.isCursedTurned) {
      victim.isCursedTurned = true;
      victim.roleId = 'WEREWOLF';
      summaryLogs.push(`🌑 Nạn nhân bị Sói cắn không chết... mà lời nguyền đã thức tỉnh! Bán Sói ${victimName} chính thức biến thành Ma Sói!`);
    } else {
      deadPlayerIds.push(werewolfTarget);
      deathReasons[werewolfTarget] = victim?.roleId === 'ELDER' 
        ? 'Già Làng bị Ma Sói cắn lần 2 và hy sinh'
        : 'Bị Ma Sói cắn chết trong đêm';
      summaryLogs.push(`🐺 ${victimName} đã bị Ma Sói cắn chết.`);
    }
  } else {
    summaryLogs.push(`🌙 Đêm nay Ma Sói không cắn ai (hoặc bị bỏ qua).`);
  }

  // 2. Xử lý nạn nhân bị Phù Thủy đầu độc
  if (witchPoisonTarget) {
    const poisonVictim = players.find(p => p.id === witchPoisonTarget);
    const poisonVictimName = poisonVictim ? `${poisonVictim.name} (Ghế ${poisonVictim.seatNumber})` : 'Một người';

    if (!deadPlayerIds.includes(witchPoisonTarget)) {
      deadPlayerIds.push(witchPoisonTarget);
      deathReasons[witchPoisonTarget] = 'Bị Phù Thủy dùng bình độc ám sát';
      summaryLogs.push(`☠️ ${poisonVictimName} đã bị Phù Thủy đầu độc chết.`);
    }
  }

  // 3. Xử lý Cặp Đôi (Lovers) chết chùm
  if (lovers) {
    const [loverAId, loverBId] = lovers;
    const loverADead = deadPlayerIds.includes(loverAId);
    const loverBDead = deadPlayerIds.includes(loverBId);

    if (loverADead && !loverBDead) {
      const partner = players.find(p => p.id === loverBId);
      deadPlayerIds.push(loverBId);
      deathReasons[loverBId] = 'Tuẫn tiết chết theo người yêu';
      summaryLogs.push(`💔 ${partner ? partner.name : 'Người yêu'} quá đau buồn vì người yêu chết nên đã tuẫn tiết đi theo!`);
    } else if (loverBDead && !loverADead) {
      const partner = players.find(p => p.id === loverAId);
      deadPlayerIds.push(loverAId);
      deathReasons[loverAId] = 'Tuẫn tiết chết theo người yêu';
      summaryLogs.push(`💔 ${partner ? partner.name : 'Người yêu'} quá đau buồn vì người yêu chết nên đã tuẫn tiết đi theo!`);
    }
  }

  // 4. Kiểm tra xem Thợ Săn (HUNTER) có nằm trong danh sách chết không
  let hunterTriggeredId: string | null = null;
  for (const deadId of deadPlayerIds) {
    const deadP = players.find(p => p.id === deadId);
    if (deadP && deadP.roleId === 'HUNTER') {
      const targetId = currentNightAction.hunterTargetId;
      const target = targetId ? players.find(p => p.id === targetId) : null;
      if (target && !deadPlayerIds.includes(target.id)) {
        deadPlayerIds.push(target.id);
        deathReasons[target.id] = `Bị Thợ Săn ${deadP.name} găm đạn bắn chết`;
        summaryLogs.push(`🏹 Thợ Săn ${deadP.name} ngã xuống! Phát đạn găm sẵn lập tức hạ gục ${target.name} (Ghế ${target.seatNumber})!`);
        hunterTriggeredId = null;
      } else {
        hunterTriggeredId = deadId;
        summaryLogs.push(`🏹 Thợ Săn ${deadP.name} đã ngã xuống! Súng báo thù được kích hoạt!`);
      }
      break;
    }
  }

  // 5. Kiểm tra lại Cặp Đôi chết chùm nếu mục tiêu của Thợ Săn nằm trong cặp đôi
  if (lovers) {
    const [loverAId, loverBId] = lovers;
    const loverADead = deadPlayerIds.includes(loverAId);
    const loverBDead = deadPlayerIds.includes(loverBId);

    if (loverADead && !loverBDead) {
      const partner = players.find(p => p.id === loverBId);
      deadPlayerIds.push(loverBId);
      deathReasons[loverBId] = 'Tuẫn tiết chết theo người yêu';
      summaryLogs.push(`💔 ${partner ? partner.name : 'Người yêu'} quá đau buồn vì người yêu chết nên đã tuẫn tiết đi theo!`);
    } else if (loverBDead && !loverADead) {
      const partner = players.find(p => p.id === loverAId);
      deadPlayerIds.push(loverAId);
      deathReasons[loverAId] = 'Tuẫn tiết chết theo người yêu';
      summaryLogs.push(`💔 ${partner ? partner.name : 'Người yêu'} quá đau buồn vì người yêu chết nên đã tuẫn tiết đi theo!`);
    }
  }

  return {
    deadPlayerIds,
    deathReasons,
    hunterTriggeredId,
    summaryLogs,
  };
}

/**
 * Kiểm tra điều kiện kết thúc ván đấu
 */
export function evaluateWinCondition(players: Player[], lovers: [string, string] | null): WinConditionResult {
  const alivePlayers = players.filter(p => p.isAlive);
  
  if (alivePlayers.length === 0) {
    return {
      isOver: true,
      winner: 'NONE',
      reason: 'Tất cả mọi người đều đã chết! Ván đấu kết thúc hòa.',
    };
  }

  // Kiểm tra điều kiện Cặp đôi khác phe thắng riêng:
  // Nếu có cặp đôi và cặp đôi gồm 1 Sói + 1 Phe khác, và chỉ còn 2 người họ sống
  if (lovers) {
    const [loverAId, loverBId] = lovers;
    const loverA = players.find(p => p.id === loverAId);
    const loverB = players.find(p => p.id === loverBId);

    if (loverA?.isAlive && loverB?.isAlive) {
      const isCrossTeam = 
        (loverA.roleId === 'WEREWOLF' && loverB.roleId !== 'WEREWOLF') ||
        (loverB.roleId === 'WEREWOLF' && loverA.roleId !== 'WEREWOLF');

      if (isCrossTeam && alivePlayers.length === 2) {
        return {
          isOver: true,
          winner: 'LOVERS',
          reason: `💘 Tình yêu vĩ đại vượt qua giới hạn chủng tộc! Cặp đôi (${loverA.name} & ${loverB.name}) là 2 người sống sót duy nhất!`,
        };
      }
    }
  }

  const aliveWerewolves = alivePlayers.filter(p => ROLE_DEFINITIONS[p.roleId].team === 'WEREWOLF');
  const aliveVillagers = alivePlayers.filter(p => ROLE_DEFINITIONS[p.roleId].team === 'VILLAGE');

  // Điều kiện 1: Toàn bộ Sói đã bị tiêu diệt
  if (aliveWerewolves.length === 0) {
    return {
      isOver: true,
      winner: 'VILLAGE',
      reason: '🎉 Toàn bộ Ma Sói đã bị tiêu diệt! Dân Làng giành chiến thắng vẻ vang!',
    };
  }

  // Điều kiện 2: Số Sói >= Số Dân còn lại
  if (aliveWerewolves.length >= aliveVillagers.length) {
    return {
      isOver: true,
      winner: 'WEREWOLF',
      reason: `🐺 Số lượng Ma Sói (${aliveWerewolves.length}) đã áp đảo hoặc bằng Dân Làng (${aliveVillagers.length})! Đêm vĩnh hằng giáng xuống, Ma Sói chiến thắng!`,
    };
  }

  return {
    isOver: false,
    winner: 'NONE',
    reason: 'Trận đấu đang tiếp diễn...',
  };
}

/**
 * Tạo log ván đấu tiện lợi
 */
export function createRoundLog(round: number, phase: 'NIGHT' | 'DAY', title: string, details: string[]): RoundLog {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    round,
    time: timeStr,
    phase,
    title,
    details,
  };
}
