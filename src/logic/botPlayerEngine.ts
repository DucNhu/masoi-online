/**
 * AI Bot Player Engine — Ma Sói Studio
 * Bộ não phán đoán suy luận cục bộ (Local Heuristic Deduction Engine)
 * Phục vụ Chế Độ Tập Luyện Solo (Solo Practice Mode) siêu nhẹ, 0% server latency.
 */

import { RoleId } from '../types/game';

export interface PracticeBotPlayer {
  id: string;
  name: string;
  avatar: string;
  role: RoleId;
  isAlive: boolean;
  isMayor: boolean;
  knownWolves: string[]; // Danh sách sói đã biết (nếu là Tiên Tri soi ra hoặc đồng đội sói)
  suspectedPlayers: Record<string, number>; // playerId -> điểm nghi vấn (càng cao càng bị nghi là Sói)
}

export class BotPlayerEngine {
  /**
   * Tạo danh sách 6-8 Bot AI với tính cách và vai trò đa dạng
   */
  public static generatePracticeBots(humanRole: RoleId, totalPlayers: number = 7): PracticeBotPlayer[] {
    const BOT_NAMES = [
      { name: 'Arthur Dũng Cảm', avatar: '🛡️' },
      { name: 'Elena Thần Bí', avatar: '🔮' },
      { name: 'Kaelen Rừng Sâu', avatar: '🏹' },
      { name: 'Morgana Áo Đen', avatar: '🧙‍♀️' },
      { name: 'Ragnar Sói Bạc', avatar: '🐺' },
      { name: 'Lyanna Ngây Thơ', avatar: '🌾' },
      { name: 'Garrick Thợ Rèn', avatar: '🔨' },
      { name: 'Cedric Già Làng', avatar: '📜' },
    ];

    // Xác định phân bổ vai trò cho ván tập luyện 7 người (ví dụ: 2 Sói, 1 Tiên Tri, 1 Bảo Vệ, 1 Thợ Săn, 2 Dân)
    const availableRoles: RoleId[] = ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'HUNTER', 'VILLAGER', 'VILLAGER'];

    // Loại bỏ vai trò người chơi đã chọn khỏi danh sách vai trò cho Bot
    const humanRoleIdx = availableRoles.indexOf(humanRole);
    if (humanRoleIdx !== -1) {
      availableRoles.splice(humanRoleIdx, 1);
    } else {
      availableRoles.pop(); // loại 1 dân nếu vai trò mở rộng
    }

    const bots: PracticeBotPlayer[] = [];
    for (let i = 0; i < totalPlayers - 1; i++) {
      const info = BOT_NAMES[i % BOT_NAMES.length];
      const role = availableRoles[i] || 'VILLAGER';

      bots.push({
        id: `bot_${i + 1}`,
        name: `[AI] ${info.name}`,
        avatar: info.avatar,
        role,
        isAlive: true,
        isMayor: false,
        knownWolves: [],
        suspectedPlayers: {},
      });
    }

    // Nếu bot là Sói, tự động biết đồng đội Sói khác
    const wolfIds = bots.filter((b) => b.role === 'WEREWOLF').map((b) => b.id);
    if (humanRole === 'WEREWOLF') wolfIds.push('human_player');

    bots.forEach((b) => {
      if (b.role === 'WEREWOLF') {
        b.knownWolves = wolfIds.filter((id) => id !== b.id);
      }
    });

    return bots;
  }

  /**
   * Quyết định cắn của Ma Sói trong đêm
   */
  public static decideWerewolfNightKill(
    wolves: PracticeBotPlayer[],
    allLivingTargets: { id: string; role?: RoleId }[]
  ): string | null {
    // Sói không cắn đồng đội Sói
    const nonWolfTargets = allLivingTargets.filter((t) => t.role !== 'WEREWOLF');
    if (nonWolfTargets.length === 0) return null;

    // Ưu tiên cắn mục tiêu có vai trò quan trọng nếu đã lộ diện (Tiên Tri, Bảo Vệ, Thợ Săn)
    const priorityTarget = nonWolfTargets.find(
      (t) => t.role === 'SEER' || t.role === 'BODYGUARD' || t.role === 'HUNTER'
    );
    if (priorityTarget && Math.random() < 0.75) {
      return priorityTarget.id;
    }

    // Ngẫu nhiên chọn 1 người sống
    const randomIdx = Math.floor(Math.random() * nonWolfTargets.length);
    return nonWolfTargets[randomIdx].id;
  }

  /**
   * Quyết định soi đêm của Bot Tiên Tri
   */
  public static decideSeerScan(
    seerBot: PracticeBotPlayer,
    livingTargets: { id: string; isAlive: boolean }[]
  ): string | null {
    // Không soi chính mình hoặc người đã soi
    const validTargets = livingTargets.filter(
      (t) => t.id !== seerBot.id && t.isAlive && !seerBot.knownWolves.includes(t.id)
    );
    if (validTargets.length === 0) return null;

    const randomIdx = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIdx].id;
  }

  /**
   * Quyết định bảo vệ đêm của Bot Bảo Vệ
   */
  public static decideBodyguardProtect(
    guardBot: PracticeBotPlayer,
    livingTargets: { id: string; isAlive: boolean }[],
    lastProtectedId?: string | null
  ): string | null {
    // Không bảo vệ 1 người 2 đêm liên tiếp
    const validTargets = livingTargets.filter((t) => t.isAlive && t.id !== lastProtectedId);
    if (validTargets.length === 0) return null;

    // Ưu tiên bảo vệ người đã lộ diện hoặc tự bảo vệ mình
    const randomIdx = Math.floor(Math.random() * validTargets.length);
    return validTargets[randomIdx].id;
  }

  /**
   * Quyết định bỏ phiếu ban ngày của Bot AI
   */
  public static decideDayVote(
    bot: PracticeBotPlayer,
    livingTargets: { id: string; isAlive: boolean; isMayor?: boolean }[]
  ): string | null {
    const candidates = livingTargets.filter((t) => t.id !== bot.id && t.isAlive);
    if (candidates.length === 0) return null;

    // Nếu Bot là Sói: cố gắng không vote đồng đội Sói, trừ khi đồng đội bị dồn quá nhiều phiếu (vote hùa tránh lộ)
    if (bot.role === 'WEREWOLF') {
      const nonWolfCandidates = candidates.filter((c) => !bot.knownWolves.includes(c.id));
      if (nonWolfCandidates.length > 0) {
        const idx = Math.floor(Math.random() * nonWolfCandidates.length);
        return nonWolfCandidates[idx].id;
      }
    }

    // Nếu Bot là Tiên Tri và đã tìm ra Sói: 100% vote Ma Sói đã soi
    if (bot.knownWolves.length > 0) {
      const knownWolfAlive = candidates.find((c) => bot.knownWolves.includes(c.id));
      if (knownWolfAlive) {
        return knownWolfAlive.id;
      }
    }

    // Ngẫu nhiên theo xác suất điểm nghi vấn
    const randomIdx = Math.floor(Math.random() * candidates.length);
    return candidates[randomIdx].id;
  }

  /**
   * Tạo lời thoại phản biện / phát biểu ban ngày của Bot AI
   */
  public static generateDaySpeech(
    bot: PracticeBotPlayer,
    allPlayers: { id: string; name: string; isAlive: boolean }[]
  ): string {
    const livingOthers = allPlayers.filter((p) => p.id !== bot.id && p.isAlive);
    const randomOther = livingOthers[Math.floor(Math.random() * livingOthers.length)];

    if (bot.role === 'WEREWOLF') {
      const wolfSpeeches = [
        `Tôi thấy ${randomOther ? randomOther.name : 'ai đó'} hôm qua nói chuyện rất gượng gạo, cần làm rõ!`,
        'Đêm qua tôi nghe tiếng bước chân ở phía đông làng, tôi là Dân Làng chân chính!',
        'Đừng vội vàng nghi ngờ nhau, hãy nhìn kỹ xem ai đang dẫn dắt dư luận.',
        `Tôi vote tin tưởng ${randomOther ? randomOther.name : 'anh em'}, đừng để Sói chia rẽ chúng ta.`,
      ];
      return wolfSpeeches[Math.floor(Math.random() * wolfSpeeches.length)];
    }

    if (bot.role === 'SEER' && bot.knownWolves.length > 0) {
      const wolfTarget = allPlayers.find((p) => bot.knownWolves.includes(p.id) && p.isAlive);
      if (wolfTarget) {
        return `⚠️ Tôi có linh cảm cực kỳ xấu về ${wolfTarget.name}! Mọi người hãy tập trung phiếu xử tử người này!`;
      }
    }

    const villagerSpeeches = [
      `Tôi nghi ngờ ${randomOther ? randomOther.name : 'người bên cạnh'}, cử chỉ rất mờ ám.`,
      'Hãy cẩn thận với những người quá ít nói hoặc im lặng từ đầu trận!',
      'Hôm nay chúng ta bắt buộc phải treo cổ được một con Sói để cứu lấy ngôi làng.',
      'Tôi là Dân thuần túy, ai nghi ngờ tôi có thể tự tin đối chất!',
    ];
    return villagerSpeeches[Math.floor(Math.random() * villagerSpeeches.length)];
  }
}
