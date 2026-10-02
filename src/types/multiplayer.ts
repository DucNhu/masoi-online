import { RoleId, PlayingCard, NightStepAction } from './game';

export type RoomPhase = 
  | 'LOBBY'
  | 'NIGHT'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_HANGING'
  | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number;
  discussionTimeSeconds: number;
  votingTimeSeconds: number;
  allowExpansionRoles: boolean;
  activeExpansionRoles: RoleId[];
  isPrivate: boolean;
}

export interface NetworkPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  seatNumber: number;
  hasVoted: boolean;
  hasActedNight: boolean;
}

/**
 * Server Master State — Giữ toàn bộ thông tin tuyệt mật
 * Tuyệt đối KHÔNG BAO GIỜ gửi trực tiếp toàn bộ object này xuống Client!
 */
export interface ServerGameState {
  roomId: string;
  phase: RoomPhase;
  subPhase?: string;
  settings: RoomSettings;
  dayNumber: number;
  timerSeconds: number;
  players: (NetworkPlayer & {
    role: RoleId;
    card?: PlayingCard;
    sessionToken: string;
    isCoupleWith?: string;
    elderLivesRemaining?: number;
    idiotRevealed?: boolean;
    cursedTurnedWolf?: boolean;
  })[];
  nightActions: NightStepAction;
  seerHistory: Record<string, { targetId: string; isWolf: boolean }>; // seerId -> result
  currentVotes: Record<string, string | null>; // voterId -> targetId
  winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS' | null;
  historyLog: string[];
}

/**
 * Client View State — Zero-Knowledge Masked State
 * Chỉ chứa những dữ liệu mà người chơi CỤ THỂ ĐƯỢC PHÉP BIẾT
 */
export interface ClientGameState {
  roomId: string;
  phase: RoomPhase;
  subPhase?: string;
  dayNumber: number;
  timerSeconds: number;
  players: NetworkPlayer[];
  myPlayerId: string;
  myRole: RoleId;
  myCard?: PlayingCard;
  
  // Thông tin được tiết lộ có chọn lọc theo vai trò
  revealedRoles: Record<string, RoleId>; // Các vai trò đã chết công khai
  teamMates: string[]; // Danh sách ID đồng đội sói (nếu là Sói / Bán Tơ)
  couplePartnerId?: string; // ID người yêu (nếu được Cupid ghép đôi)
  seerScanResult?: { targetId: string; isWolf: boolean }; // Kết quả soi đêm gần nhất của Tiên Tri
  
  historyLog: string[];
  winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS' | null;
}

/**
 * Gói tin Action Client gửi lên Server
 */
export type ClientAction =
  | { type: 'JOIN_ROOM'; payload: { roomId: string; playerName: string; avatar: string; sessionToken?: string } }
  | { type: 'CREATE_ROOM'; payload: { hostName: string; avatar: string; settings: RoomSettings } }
  | { type: 'TOGGLE_READY'; payload: { isReady: boolean } }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_NIGHT_ACTION'; payload: { targetId?: string; targetId2?: string; actionType: string } }
  | { type: 'CAST_VOTE'; payload: { targetId: string | null } }
  | { type: 'SEND_CHAT'; payload: { text: string; channel: 'PUBLIC' | 'WOLF' | 'DEAD' } };
