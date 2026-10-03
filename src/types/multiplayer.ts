import { RoleId, PlayingCard, NightStepAction } from './game';

export type RoomPhase = 
  | 'LOBBY'
  | 'NIGHT'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_HANGING'
  | 'GAME_OVER';

export type ArenaThemeId = 'BLOOD_MOON' | 'GOTHIC_CASTLE' | 'MISTY_SWAMP' | 'ENCHANTED_FOREST';

export interface RoomSettings {
  tableName?: string;
  arenaTheme?: ArenaThemeId;
  maxPlayers: number;
  discussionTimeSeconds: number;
  votingTimeSeconds: number;
  nightActionTimeSeconds?: number;
  allowExpansionRoles: boolean;
  activeExpansionRoles: RoleId[];
  isPrivate: boolean;
  enableMayor?: boolean;
  enableFoolImmunity?: boolean;
}

export interface PublicTableInfo {
  roomId: string;
  tableName: string;
  arenaTheme?: ArenaThemeId;
  hostName: string;
  hostAvatar: string;
  currentPlayers: number;
  maxPlayers: number;
  phase: RoomPhase;
  isPrivate: boolean;
  enableMayor?: boolean;
  allowExpansionRoles?: boolean;
  spectatorsCount?: number;
  createdAt: number;
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
  isMayor?: boolean;
  idiotRevealed?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  peerId?: string;
}

export interface VoiceSignalPayload {
  senderId: string;
  receiverId: string; // ID người nhận, hoặc '*' nếu là broadcast trong phòng
  signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MUTE_STATE';
  data: string;
  timestamp: number;
}

export interface SpectatorInfo {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
}

export interface LiveCheer {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  channel: 'PUBLIC' | 'WOLF' | 'DEAD' | 'SPECTATOR';
  text: string;
  timestamp: number;
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
  mayorPlayerId?: string | null;
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
  chatMessages: ChatMessage[];
  winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS' | null;
  historyLog: string[];
  spectators?: SpectatorInfo[];
  liveCheers?: LiveCheer[];
  createdAt?: number;
}

/**
 * Client View State — Zero-Knowledge Masked State
 * Chỉ chứa những dữ liệu mà người chơi CỤ THỂ ĐƯỢC PHÉP BIẾT
 */
export interface ClientGameState {
  roomId: string;
  tableName?: string;
  arenaTheme?: ArenaThemeId;
  phase: RoomPhase;
  subPhase?: string;
  dayNumber: number;
  timerSeconds: number;
  mayorPlayerId?: string | null;
  players: NetworkPlayer[];
  myPlayerId: string;
  myRole: RoleId;
  myCard?: PlayingCard;
  isSpectator?: boolean;
  spectatorsCount?: number;
  liveCheers?: LiveCheer[];
  
  // Thông tin được tiết lộ có chọn lọc theo vai trò
  revealedRoles: Record<string, RoleId>; // Các vai trò đã chết công khai
  teamMates: string[]; // Danh sách ID đồng đội sói (nếu là Sói / Bán Tơ)
  couplePartnerId?: string; // ID người yêu (nếu được Cupid ghép đôi)
  seerScanResult?: { targetId: string; isWolf: boolean }; // Kết quả soi đêm gần nhất của Tiên Tri
  
  // Thông tin Bỏ phiếu & Chat phân quyền
  voteTally?: Record<string, number>; // targetId -> số phiếu nhận được
  myVote?: string | null;
  chatMessages: ChatMessage[];

  historyLog: string[];
  winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS' | null;
}

/**
 * Gói tin Action Client gửi lên Server
 */
export type ClientAction =
  | { type: 'JOIN_ROOM'; payload: { roomId: string; playerName: string; avatar: string; sessionToken?: string } }
  | { type: 'JOIN_SPECTATOR'; payload: { roomId: string; spectatorName: string; avatar: string } }
  | { type: 'CREATE_ROOM'; payload: { hostName: string; avatar: string; settings: RoomSettings } }
  | { type: 'TOGGLE_READY'; payload: { isReady: boolean } }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_NIGHT_ACTION'; payload: { targetId?: string; targetId2?: string; actionType: string } }
  | { type: 'CAST_VOTE'; payload: { targetId: string | null } }
  | { type: 'ASSIGN_MAYOR'; payload: { targetPlayerId: string } }
  | { type: 'SEND_CHAT'; payload: { text: string; channel: 'PUBLIC' | 'WOLF' | 'DEAD' | 'SPECTATOR' } }
  | { type: 'SEND_CHEER'; payload: { emoji: string } };
