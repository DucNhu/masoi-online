export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardSuit = '♠' | '♣' | '♦' | '♥';

export interface PlayingCard {
  rank: CardRank;
  suit?: CardSuit;
}

export type RoleId = 
  | 'WEREWOLF'   // Ma Sói (Mặc định: K)
  | 'SEER'       // Tiên Tri (Mặc định: A)
  | 'WITCH'      // Phù Thủy (Mặc định: Q)
  | 'BODYGUARD'  // Bảo Vệ (Mặc định: J)
  | 'HUNTER'     // Thợ Săn (Mặc định: 10)
  | 'CUPID'      // Thần Tình Yêu (Mở rộng: 9)
  | 'MINION'     // Kẻ Bán Tơ / Phản Bội (Mở rộng: 8)
  | 'ELDER'      // Già Làng (Mở rộng: 7)
  | 'IDIOT'      // Kẻ Ngốc / Thằng Khờ (Mở rộng: 6)
  | 'CURSED'     // Bán Sói (Mở rộng: 5)
  | 'MAYOR'      // Thị Trưởng / Trưởng Làng (Mở rộng: 4)
  | 'VILLAGER';  // Dân Làng (Mặc định: 2..9)

export type TeamSide = 'WEREWOLF' | 'VILLAGE' | 'LOVERS';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  nameEn: string;
  defaultRank: CardRank | CardRank[];
  team: TeamSide;
  description: string;
  nightOrder: number; // Thứ tự gọi dậy trong đêm (0 = không gọi, 1 = đầu tiên, ...)
  wakeEveryNight: boolean; // true = đêm nào cũng gọi, false = chỉ đêm đầu
  iconName: string;
  color: string;
  badgeBg: string;
  isExpansion?: boolean; // Đánh dấu vai trò thuộc gói mở rộng
}

export interface CardMappingConfig {
  [key: string]: RoleId; // CardRank -> RoleId
}

export interface Player {
  id: string;
  seatNumber: number;
  name: string;
  card: PlayingCard;
  roleId: RoleId;
  isAlive: boolean;
  deathReason?: string;
  deathRound?: number;
  isLover: boolean;
  loverWithId?: string;
  elderLivesRemaining?: number; // Già Làng: 2 mạng trước đòn cắn của Sói
  isIdiotRevealed?: boolean;    // Kẻ Ngốc: đã lật bài thoát chết treo cổ
  isCursedTurned?: boolean;     // Bán Sói: đã bị cắn và thức tỉnh thành Ma Sói
  isMayor?: boolean;            // Thị Trưởng: phiếu biểu quyết tính x2
}

export type GamePhase = 
  | 'SETUP'
  | 'NIGHT_START'
  | 'NIGHT_CUPID'
  | 'NIGHT_MINION'
  | 'NIGHT_BODYGUARD'
  | 'NIGHT_HUNTER'
  | 'NIGHT_WEREWOLF'
  | 'NIGHT_WITCH'
  | 'NIGHT_SEER'
  | 'DAY_DAWN'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_EXECUTION'
  | 'GAME_OVER';

export interface NightStepAction {
  protectedPlayerId: string | null;
  hunterTargetId?: string | null;
  werewolfTargetId: string | null;
  witchSaved: boolean;
  witchPoisonTargetId: string | null;
  seerTargetId: string | null;
}

export interface WitchPotions {
  hasHealPotion: boolean;
  hasPoisonPotion: boolean;
}

export interface RoundLog {
  id: string;
  round: number;
  time: string;
  phase: 'NIGHT' | 'DAY';
  title: string;
  details: string[];
}

export interface WinConditionResult {
  isOver: boolean;
  winner: TeamSide | 'NONE';
  reason: string;
}

export interface GameState {
  round: number;
  phase: GamePhase;
  players: Player[];
  cardMappings: CardMappingConfig;
  witchPotions: WitchPotions;
  lastProtectedPlayerId: string | null; // Để kiểm tra luật không bảo vệ 1 người 2 đêm liền
  currentNightAction: NightStepAction;
  cupidPaired: boolean;
  lovers: [string, string] | null;
  historyLogs: RoundLog[];
  winner: TeamSide | null;
  winReason: string | null;
  hunterPendingRevenge: boolean; // Nếu thợ săn chết, cờ này bật để yêu cầu chọn mục tiêu bắn
  hunterPendingPlayerId: string | null;
  privacyShield: boolean; // Che vai trò chống nhìn lén
}
