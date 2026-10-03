import React, { useState, useEffect, useCallback } from 'react';
import { roomManager } from '../logic/roomManager';
import { ClientGameState, RoomSettings, PublicTableInfo } from '../types/multiplayer';
import { RoleId } from '../types/game';
import { OnlinePlayerGameView } from './OnlinePlayerGameView';
import { ConfirmModal } from './ConfirmModal';
import { AvatarPickerModal } from './AvatarPickerModal';
import { GoldenHourBanner } from './GoldenHourBanner';
import { HumanVerifyModal } from './HumanVerifyModal';
import { LeaderboardModal } from './LeaderboardModal';
import { HunterProfileModal } from './HunterProfileModal';
import { WEREWOLF_AVATARS, WerewolfAvatar } from '../constants/avatars';
import { soundEffects } from '../utils/soundEffects';
import { Users, Crown, CheckCircle2, Clock, Copy, Check, ArrowLeft, Play, LogOut, ShieldAlert, Sliders, Sparkles, RefreshCw, KeyRound, Plus, ShieldCheck, Trophy, Award, Share2, Eye, Sword } from 'lucide-react';
import { shareRoomInvite, extractRoomCodeFromUrl, clearRoomCodeFromUrl } from '../utils/shareInvite';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import { SpectatorLiveView } from './SpectatorLiveView';
import { SoloPracticeModal } from './SoloPracticeModal';
import { BotPlayerEngine } from '../logic/botPlayerEngine';
import { ARENA_THEMES, ArenaThemeId } from '../constants/arenaThemes';

interface Props {
  onBackToOffline: () => void;
  onGameStarted?: (state: ClientGameState) => void;
}

export const OnlineLobby: React.FC<Props> = ({ onBackToOffline, onGameStarted }) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('masoi_player_name') || '';
    } catch {
      return '';
    }
  });
  const [selectedAvatarObj, setSelectedAvatarObj] = useState<WerewolfAvatar>(WEREWOLF_AVATARS[0]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [tableNameInput, setTableNameInput] = useState<string>('');
  const [activeView, setActiveView] = useState<'TABLES' | 'CREATE' | 'JOIN' | 'ROOM' | 'SPECTATOR'>('TABLES');
  const [spectatorSession, setSpectatorSession] = useState<{ roomId: string; spectatorId: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [showLeaveRoomConfirm, setShowLeaveRoomConfirm] = useState<boolean>(false);

  // Danh sách bàn chơi trực tuyến & Anti-Bot Verification
  const [publicTables, setPublicTables] = useState<PublicTableInfo[]>(() => {
    try {
      return roomManager.listPublicTables();
    } catch {
      return [];
    }
  });
  const [isRefreshingTables, setIsRefreshingTables] = useState<boolean>(false);
  const [isHumanVerified, setIsHumanVerified] = useState<boolean>(false);
  const [isHumanModalOpen, setIsHumanModalOpen] = useState<boolean>(false);
  const [pendingJoinTable, setPendingJoinTable] = useState<PublicTableInfo | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState<boolean>(false);
  const [selectedArenaTheme, setSelectedArenaTheme] = useState<ArenaThemeId>('BLOOD_MOON');

  // Cấu hình phòng chơi nâng cao (Host Settings)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [discussionTime, setDiscussionTime] = useState<number>(60);
  const [votingTime, setVotingTime] = useState<number>(30);
  const [nightTime, setNightTime] = useState<number>(25);
  const [enableMayor, setEnableMayor] = useState<boolean>(true);
  const [enableFoolImmunity, setEnableFoolImmunity] = useState<boolean>(true);
  const [activeExpRoles, setActiveExpRoles] = useState<RoleId[]>(['IDIOT', 'CURSED', 'ELDER']);

  // Trạng thái phiên hiện tại trong phòng
  const [currentSession, setCurrentSession] = useState<{
    roomId: string;
    playerId: string;
    sessionToken: string;
  } | null>(null);

  const [gameState, setGameState] = useState<ClientGameState | null>(null);

  // Làm mới danh sách bàn chơi
  const refreshTables = useCallback(() => {
    setIsRefreshingTables(true);
    try {
      const tables = roomManager.listPublicTables();
      setPublicTables(tables);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách bàn:', err);
    } finally {
      setTimeout(() => setIsRefreshingTables(false), 400);
    }
  }, []);

  // Tự động kiểm tra liên kết mời (?room=CODE) khi truy cập
  useEffect(() => {
    const inviteCode = extractRoomCodeFromUrl();
    if (inviteCode) {
      setInputRoomCode(inviteCode);
      setActiveView('JOIN');
      clearRoomCodeFromUrl();
    }
  }, []);

  // Tự động load và refresh bàn chơi
  useEffect(() => {
    if (activeView === 'TABLES') {
      const interval = setInterval(() => {
        setPublicTables(roomManager.listPublicTables());
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeView]);

  // Đăng ký lắng nghe thay đổi trạng thái phòng từ RoomManager (Cả người chơi và khán giả)
  useEffect(() => {
    const targetRoomId = currentSession?.roomId || spectatorSession?.roomId;
    const targetId = currentSession?.playerId || spectatorSession?.spectatorId;

    if (!targetRoomId || !targetId) return;

    const unsubscribe = roomManager.subscribe(targetRoomId, (notifiedPlayerId, newState) => {
      if (notifiedPlayerId === targetId) {
        setGameState(newState);
        if (currentSession && newState.phase !== 'LOBBY' && onGameStarted) {
          onGameStarted(newState);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentSession, spectatorSession, onGameStarted]);

  // Tham gia phòng với tư cách Khán Giả
  const handleJoinAsSpectator = (targetRoomId: string) => {
    try {
      setErrorMessage(null);
      const cleanRoomId = targetRoomId.trim().toUpperCase();
      const res = roomManager.joinAsSpectator(
        cleanRoomId,
        playerName.trim() || 'Khán Giả',
        selectedAvatarObj.emoji
      );
      setSpectatorSession({
        roomId: cleanRoomId,
        spectatorId: res.spectatorId,
      });
      setGameState(res.state);
      setActiveView('SPECTATOR');
      soundEffects.triggerHaptic('medium');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể vào xem trận đấu');
    }
  };

  // Khởi động ván Tập Luyện Solo đối đầu 6 AI Bots
  const handleStartSoloPractice = (role: RoleId, _difficulty: 'EASY' | 'HARD') => {
    setIsPracticeModalOpen(false);
    try {
      const res = roomManager.createRoom(
        playerName.trim() || 'Thợ Săn Solo',
        selectedAvatarObj.emoji,
        {
          tableName: `Tập Luyện Solo • ${role}`,
          maxPlayers: 7,
          allowExpansionRoles: true,
          isPrivate: true,
        }
      );

      const serverRoom = roomManager.getServerRoom(res.roomId);
      if (serverRoom) {
        // Gán vai trò mong muốn cho người chơi
        const me = serverRoom.players.find((p) => p.id === res.playerId);
        if (me) {
          me.role = role;
        }

        // Tạo 6 Bots thông minh
        const bots = BotPlayerEngine.generatePracticeBots(role, 7);
        bots.forEach((bot, index) => {
          serverRoom.players.push({
            id: bot.id,
            name: bot.name,
            avatar: bot.avatar,
            isHost: false,
            isReady: true,
            isAlive: true,
            seatNumber: index + 2,
            hasVoted: false,
            hasActedNight: false,
            role: bot.role,
            sessionToken: `token_${bot.id}`,
          });
        });

        // Bắt đầu game ngay lập tức
        roomManager.startGame(res.roomId, res.playerId);
      }

      setCurrentSession({
        roomId: res.roomId,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      const maskedState = roomManager.getMaskedState(res.roomId, res.playerId);
      setGameState(maskedState);
      if (onGameStarted) {
        onGameStarted(maskedState);
      }
      soundEffects.triggerHaptic('medium');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi khởi tạo ván tập luyện');
    }
  };

  // Thực thi vào phòng
  const executeJoinRoom = (targetRoomId: string) => {
    try {
      const cleanRoomId = targetRoomId.trim().toUpperCase();
      const res = roomManager.joinRoom(cleanRoomId, playerName.trim(), selectedAvatarObj.emoji);
      try {
        localStorage.setItem('masoi_player_name', playerName.trim());
      } catch {}

      setCurrentSession({
        roomId: cleanRoomId,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      setGameState(res.state);
      setActiveView('ROOM');
      soundEffects.triggerHaptic('medium');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tham gia bàn chơi');
    }
  };

  // Click vào bàn từ danh sách Table Lobby
  const handleJoinTableClick = (table: PublicTableInfo) => {
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên thợ săn của bạn ở phía trên trước khi vào bàn!');
      soundEffects.triggerHaptic('heavy');
      return;
    }
    setErrorMessage(null);

    // Kiểm tra bàn đã đầy hoặc đang chơi chưa
    if (table.currentPlayers >= table.maxPlayers) {
      setErrorMessage('Bàn chơi này đã đủ người!');
      return;
    }

    if (table.phase !== 'LOBBY') {
      setErrorMessage('Bàn chơi này trận đấu đã bắt đầu!');
      return;
    }

    // Nếu chưa xác minh người thật -> Mở modal kiểm tra chống bot
    if (!isHumanVerified) {
      setPendingJoinTable(table);
      setIsHumanModalOpen(true);
      return;
    }

    executeJoinRoom(table.roomId);
  };

  // Vượt qua xác thực người thật
  const handleHumanVerifySuccess = () => {
    setIsHumanVerified(true);
    setIsHumanModalOpen(false);
    if (pendingJoinTable) {
      executeJoinRoom(pendingJoinTable.roomId);
      setPendingJoinTable(null);
    }
  };

  // Xử lý tạo phòng
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn');
      return;
    }
    setErrorMessage(null);

    try {
      try {
        localStorage.setItem('masoi_player_name', playerName.trim());
      } catch {}

      const customSettings: Partial<RoomSettings> = {
        tableName: tableNameInput.trim() || undefined,
        arenaTheme: selectedArenaTheme,
        discussionTimeSeconds: discussionTime,
        votingTimeSeconds: votingTime,
        nightActionTimeSeconds: nightTime,
        enableMayor,
        enableFoolImmunity,
        allowExpansionRoles: activeExpRoles.length > 0,
        activeExpansionRoles: activeExpRoles,
      };

      const res = roomManager.createRoom(playerName.trim(), selectedAvatarObj.emoji, customSettings);
      setCurrentSession({
        roomId: res.roomId,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      setGameState(res.state);
      setActiveView('ROOM');
      soundEffects.triggerHaptic('medium');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi tạo phòng');
    }
  };

  // Xử lý vào phòng bằng mã thủ công
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn');
      return;
    }
    if (!inputRoomCode.trim()) {
      setErrorMessage('Vui lòng nhập mã phòng gồm 6 ký tự');
      return;
    }
    setErrorMessage(null);
    executeJoinRoom(inputRoomCode.trim().toUpperCase());
  };

  // Sao chép mã phòng
  const handleCopyCode = () => {
    if (!currentSession) return;
    navigator.clipboard.writeText(currentSession.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Chia sẻ liên kết mời vào bàn
  const handleShareInvite = async () => {
    if (!currentSession) return;
    soundEffects.triggerHaptic('medium');
    const result = await shareRoomInvite(currentSession.roomId, gameState?.tableName);
    if (result.success) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Sẵn sàng / Hủy sẵn sàng
  const handleToggleReady = () => {
    if (!currentSession || !gameState) return;
    const me = gameState.players.find((p) => p.id === currentSession.playerId);
    if (!me) return;

    roomManager.toggleReady(currentSession.roomId, currentSession.playerId, !me.isReady);
  };

  // Host bấm bắt đầu
  const handleStartGame = () => {
    if (!currentSession || !gameState) return;
    try {
      setErrorMessage(null);
      roomManager.startGame(currentSession.roomId, currentSession.playerId);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể bắt đầu ván đấu');
    }
  };

  // Rời phòng
  const handleLeaveRoom = () => {
    setCurrentSession(null);
    setGameState(null);
    setActiveView('TABLES');
  };

  const isHost = gameState?.players.find((p) => p.id === currentSession?.playerId)?.isHost;
  const me = gameState?.players.find((p) => p.id === currentSession?.playerId);

  return (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', color: '#fff' }}>
      {/* Nút quay lại Offline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={activeView === 'ROOM' ? () => setShowLeaveRoomConfirm(true) : onBackToOffline}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e2e8f0',
            padding: '8px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> {activeView === 'ROOM' ? 'Rời Phòng' : 'Về Chế Độ Offline'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NetworkStatusBadge />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px' }}>
            ONLINE
          </span>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ShieldAlert size={18} /> {errorMessage}
        </div>
      )}

      {/* VIEW 1: SẢNH BÀN CHƠI TRỰC TUYẾN (JOIN TABLE LOBBY & CHỐNG BOT) */}
      {activeView === 'TABLES' && (
        <div>
          {/* Banner Khung Giờ Vàng Hội Tụ Thợ Săn Chống Bot */}
          <GoldenHourBanner />

          {/* Thanh Profile Thợ Săn & Chọn Avatar */}
          <div
            className="card-glass"
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#1e1e2d',
                border: `2px solid ${selectedAvatarObj.auraColor}`,
                boxShadow: `0 0 12px ${selectedAvatarObj.glow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Đổi Avatar Ma Sói"
            >
              {selectedAvatarObj.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="#818cf8" /> Thợ Săn Người Thật:
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  try {
                    localStorage.setItem('masoi_player_name', e.target.value);
                  } catch {}
                }}
                placeholder="Nhập tên của bạn để vào bàn..."
                maxLength={18}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '6px 10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => setIsAvatarModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Đổi Avatar
            </button>
          </div>

          {/* Thanh Công Cụ: Tạo Bàn & Mã Riêng & Refresh */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveView('CREATE')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
                border: '1px solid rgba(129, 140, 248, 0.4)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Plus size={16} /> Tạo Bàn Mới
            </button>

            <button
              onClick={() => setActiveView('JOIN')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Nhập mã 6 ký tự để vào bàn riêng"
            >
              <KeyRound size={16} /> Nhập Mã
            </button>

            <button
              onClick={refreshTables}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '10px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Làm mới danh sách bàn chơi"
            >
              <RefreshCw size={16} className={isRefreshingTables ? 'spin-icon' : ''} />
            </button>
          </div>

          {/* Thanh Nút Phụ: Bảng Xếp Hạng, Hồ Sơ & Luyện Tập Solo AI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setIsLeaderboardOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fde047',
                padding: '8px 8px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Trophy size={13} color="#fde047" /> Xếp Hạng
            </button>

            <button
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setIsProfileOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(67, 56, 202, 0.25))',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                padding: '8px 8px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Award size={13} color="#a5b4fc" /> Hồ Sơ & Badge
            </button>

            <button
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setIsPracticeModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(126, 34, 206, 0.25))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#e9d5ff',
                padding: '8px 8px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <Sword size={13} color="#c084fc" /> Luyện Solo (AI)
            </button>
          </div>

          {/* Tiêu đề Danh Sách Bàn */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#818cf8" />
              <span>SẢNH BÀN CHƠI TRỰC TUYẾN</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>({publicTables.length} bàn)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
              ● 100% Người Thật
            </span>
          </div>

          {/* Danh Sách Các Bàn Đang Mở */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {publicTables.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌙</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '4px' }}>
                  Chưa có bàn chơi nào đang mở
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Hãy là người đầu tiên tạo bàn và mời thợ săn cùng hội tụ!
                </p>
                <button
                  onClick={() => setActiveView('CREATE')}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                >
                  <Plus size={16} /> Tạo Bàn Đầu Tiên
                </button>
              </div>
            ) : (
              publicTables.map((table) => {
                const isFull = table.currentPlayers >= table.maxPlayers;
                const isPlaying = table.phase !== 'LOBBY';
                const arenaThemeConfig = ARENA_THEMES[table.arenaTheme || 'BLOOD_MOON'] || ARENA_THEMES.BLOOD_MOON;

                return (
                  <div
                    key={table.roomId}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(17, 24, 39, 0.8))',
                      border: `1px solid ${arenaThemeConfig.borderColor}`,
                      borderRadius: '16px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {/* Top Row: Tên bàn & Trạng thái */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
                          {table.tableName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span>Chủ bàn: {table.hostAvatar} {table.hostName}</span>
                          <span>•</span>
                          <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>Mã: {table.roomId}</span>
                          <span style={{
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: `1px solid ${arenaThemeConfig.borderColor}`,
                            color: '#cbd5e1',
                            fontSize: '0.68rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            {arenaThemeConfig.icon} {arenaThemeConfig.name}
                          </span>
                        </div>
                      </div>

                      {/* Badge trạng thái */}
                      <div>
                        {isPlaying ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                          }}>
                            🔴 Đang Chiến
                          </span>
                        ) : isFull ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                          }}>
                            ⚠️ Đã Đủ Người
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                          }}>
                            🟢 Chờ Người ({table.maxPlayers - table.currentPlayers} Ghế Trống)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Thông tin số người & Luật chơi */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                          <Users size={14} color="#818cf8" />
                          {table.currentPlayers} / {table.maxPlayers} Người
                        </span>
                        {table.enableMayor && (
                          <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.7rem' }}>
                            👑 Thị Trưởng
                          </span>
                        )}
                        {table.allowExpansionRoles && (
                          <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontSize: '0.7rem' }}>
                            🃏 Mở Rộng
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button Vào Bàn hoặc Xem Trực Tiếp */}
                    {isPlaying ? (
                      <button
                        onClick={() => handleJoinAsSpectator(table.roomId)}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          borderRadius: '10px',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          cursor: 'pointer',
                          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.35), rgba(126, 34, 206, 0.5))',
                          color: '#f3e8ff',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 4px 14px rgba(147, 51, 234, 0.25)',
                        }}
                      >
                        <Eye size={16} color="#c084fc" />
                        <span>Xem Trận Đấu Trực Tiếp {table.spectatorsCount ? `(${table.spectatorsCount} 👀)` : ''}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinTableClick(table)}
                        disabled={isFull}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: isFull ? 'not-allowed' : 'pointer',
                          background: isFull
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'linear-gradient(135deg, #6366f1, #4338ca)',
                          color: isFull ? '#64748b' : '#fff',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: isFull ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.35)',
                        }}
                      >
                        {isFull ? 'Bàn Chơi Đã Đầy' : '👉 Vào Bàn Chơi Ngay (1-Click)'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: Form Tạo Phòng */}
      {activeView === 'CREATE' && (
        <form onSubmit={handleCreateRoom} style={{ background: '#12121e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0' }}>👑 Tạo Bàn Chơi Mới</h2>
          
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tên Bàn Chơi (Tùy chọn):</label>
          <input
            type="text"
            value={tableNameInput}
            onChange={(e) => setTableNameInput(e.target.value)}
            placeholder="Ví dụ: Bàn Săn Sói Hà Nội #01"
            maxLength={30}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tên của bạn:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ví dụ: Minh Quân (Host)"
            maxLength={18}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Avatar của bạn:</label>
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${selectedAvatarObj.auraColor}60`,
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              marginBottom: '16px',
              boxShadow: `0 0 16px ${selectedAvatarObj.glow}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#1e1e2d',
              border: `2px solid ${selectedAvatarObj.auraColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
            }}>
              {selectedAvatarObj.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: selectedAvatarObj.auraColor, fontSize: '0.95rem' }}>
                {selectedAvatarObj.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Bấm để mở kho 12 Avatar Ma Sói ✨
              </div>
            </div>
            <Sparkles size={18} color={selectedAvatarObj.auraColor} />
          </div>

          {/* Bộ Chọn Chủ Đề Bàn Đấu VIP (Arena Theme) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
              Chủ Đề Bàn Đấu (Arena Theme):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.values(ARENA_THEMES).map((theme) => {
                const isSelected = selectedArenaTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedArenaTheme(theme.id);
                      soundEffects.triggerHaptic('light');
                    }}
                    style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? `2px solid ${theme.borderColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 16px ${theme.accentGlow}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{theme.icon}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: theme.borderColor,
                        color: '#fff',
                      }}>
                        {theme.badge}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#fff' : '#cbd5e1' }}>
                      {theme.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.2 }}>
                      {theme.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cụm Cài Đặt Phòng Nâng Cao */}
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={16} color="#818cf8" /> Cài Đặt Luật & Thời Gian Ván Đấu
              </span>
              <span style={{ fontSize: '0.8rem', color: '#818cf8' }}>
                {showAdvancedSettings ? 'Thu gọn ▲' : 'Mở rộng ▼'}
              </span>
            </button>

            {showAdvancedSettings && (
              <div style={{
                marginTop: '10px',
                background: '#161626',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Thảo luận Ngày</label>
                    <select
                      value={discussionTime}
                      onChange={(e) => setDiscussionTime(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px', background: '#1e1e2f', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      <option value={30}>30s (Nhanh)</option>
                      <option value={60}>60s (Chuẩn)</option>
                      <option value={90}>90s</option>
                      <option value={120}>120s (Dài)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bỏ phiếu Treo cổ</label>
                    <select
                      value={votingTime}
                      onChange={(e) => setVotingTime(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px', background: '#1e1e2f', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      <option value={15}>15s (Nhanh)</option>
                      <option value={30}>30s (Chuẩn)</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Lượt Đêm</label>
                    <select
                      value={nightTime}
                      onChange={(e) => setNightTime(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px', background: '#1e1e2f', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.8rem' }}
                    >
                      <option value={15}>15s</option>
                      <option value={25}>25s (Chuẩn)</option>
                      <option value={40}>40s (Dài)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableMayor}
                      onChange={(e) => setEnableMayor(e.target.checked)}
                    />
                    <span>👑 <strong>Bật chức vị Thị Trưởng</strong> (Phiếu x2 & di chúc khi hy sinh)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableFoolImmunity}
                      onChange={(e) => setEnableFoolImmunity(e.target.checked)}
                    />
                    <span>🃏 <strong>Kẻ Ngốc lật bài tha chết</strong> (Nếu bị vote treo cổ)</span>
                  </label>
                </div>

                <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>Vai trò mở rộng tham gia:</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['IDIOT', 'CURSED', 'ELDER', 'CUPID', 'MINION'] as RoleId[]).map((rId) => {
                      const isIncluded = activeExpRoles.includes(rId);
                      return (
                        <button
                          key={rId}
                          type="button"
                          onClick={() => {
                            if (isIncluded) {
                              setActiveExpRoles(activeExpRoles.filter((r) => r !== rId));
                            } else {
                              setActiveExpRoles([...activeExpRoles, rId]);
                            }
                          }}
                          style={{
                            background: isIncluded ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                            border: isIncluded ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            color: isIncluded ? '#c7d2fe' : '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          {rId === 'IDIOT' && '🃏 Kẻ Ngốc'}
                          {rId === 'CURSED' && '🩸 Bán Sói'}
                          {rId === 'ELDER' && '👴 Già Làng'}
                          {rId === 'CUPID' && '💘 Cupid'}
                          {rId === 'MINION' && '🎭 Bán Tơ'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveView('TABLES')}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', borderRadius: '10px', cursor: 'pointer' }}
            >
              Quay Lại Sảnh Bàn
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: '12px', background: '#4f46e5', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tạo & Nhận Mã Phòng
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: Form Vào Phòng */}
      {activeView === 'JOIN' && (
        <form onSubmit={handleJoinRoom} style={{ background: '#12121e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0' }}>🔑 Vào Phòng Chơi</h2>

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Mã phòng 6 ký tự:</label>
          <input
            type="text"
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
            placeholder="Ví dụ: WLKF88"
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '2px solid #6366f1',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tên của bạn:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ví dụ: Hoàng Long"
            maxLength={18}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Avatar của bạn:</label>
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${selectedAvatarObj.auraColor}60`,
              borderRadius: '12px',
              padding: '10px 14px',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: `0 0 16px ${selectedAvatarObj.glow}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#1e1e2d',
              border: `2px solid ${selectedAvatarObj.auraColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              flexShrink: 0,
            }}>
              {selectedAvatarObj.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: selectedAvatarObj.auraColor, fontSize: '0.95rem' }}>
                {selectedAvatarObj.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Bấm để mở kho 12 Avatar Ma Sói ✨
              </div>
            </div>
            <Sparkles size={18} color={selectedAvatarObj.auraColor} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveView('TABLES')}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', borderRadius: '10px', cursor: 'pointer' }}
            >
              Quay Lại Sảnh Bàn
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: '12px', background: '#059669', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tham Gia Phòng
            </button>
          </div>
        </form>
      )}

      {/* VIEW 4: Phòng Chờ (Lobby Room) hoặc Màn Hình Ván Đấu Trực Tuyến */}
      {activeView === 'ROOM' && gameState && currentSession && (
        gameState.phase !== 'LOBBY' ? (
          <OnlinePlayerGameView
            gameState={gameState}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <div>
            {/* Card Mã Phòng & Link Chia Sẻ */}
            <div style={{
            background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
              MÃ PHÒNG CHƠI
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '6px',
              color: '#38bdf8',
              margin: '6px 0',
              fontFamily: 'Montserrat, monospace',
            }}>
              {currentSession.roomId}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  background: copiedCode ? '#059669' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                {copiedCode ? 'Đã Sao Chép!' : 'Sao Chép Mã'}
              </button>

              <button
                type="button"
                onClick={handleShareInvite}
                style={{
                  background: copiedShare ? '#059669' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {copiedShare ? <Check size={14} /> : <Share2 size={14} />}
                {copiedShare ? 'Đã Sao Chép Link!' : 'Chia Sẻ Link Mời'}
              </button>
            </div>
          </div>

          {/* Thanh Thông Tin Phòng */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#94a3b8' }}>
              <Users size={16} />
              <span>Người chơi: <strong style={{ color: '#fff' }}>{gameState.players.length}/12</strong></span>
            </div>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              ĐANG ĐỢI BẮT ĐẦU
            </span>
          </div>

          {/* Danh Sách Ghế Ngồi Người Chơi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {gameState.players.map((p) => (
              <div
                key={p.id}
                style={{
                  background: p.id === currentSession.playerId ? 'rgba(99, 102, 241, 0.15)' : '#161622',
                  border: p.id === currentSession.playerId ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '8px',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: 700,
                }}>
                  #{p.seatNumber}
                </div>
                {p.isHost && (
                  <div style={{ position: 'absolute', top: '6px', right: '8px' }}>
                    <Crown size={14} color="#f59e0b" />
                  </div>
                )}
                <div style={{ fontSize: '2rem', margin: '8px 0 4px 0' }}>{p.avatar}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name} {p.id === currentSession.playerId && '(Bạn)'}
                </div>
                <div style={{ marginTop: '6px' }}>
                  {p.isHost ? (
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Chủ Phòng</span>
                  ) : p.isReady ? (
                    <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle2 size={12} /> Sẵn sàng
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={12} /> Chờ...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Thanh Thông Tin Luật Phòng Chơi */}
          {gameState && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              justifyContent: 'center',
            }}>
              <span>⏱️ Thảo luận: <strong style={{ color: '#f1f5f9' }}>{discussionTime}s</strong></span>
              <span>🗳️ Bỏ phiếu: <strong style={{ color: '#f1f5f9' }}>{votingTime}s</strong></span>
              <span>🌙 Lượt Đêm: <strong style={{ color: '#f1f5f9' }}>{nightTime}s</strong></span>
              <span>👑 Thị Trưởng: <strong style={{ color: enableMayor ? '#facc15' : '#64748b' }}>{enableMayor ? 'Bật' : 'Tắt'}</strong></span>
              <span>🃏 Kẻ Ngốc: <strong style={{ color: enableFoolImmunity ? '#06b6d4' : '#64748b' }}>{enableFoolImmunity ? 'Bật' : 'Tắt'}</strong></span>
            </div>
          )}

          {/* Action Bar dưới cùng */}
          <div style={{
            position: 'sticky',
            bottom: '16px',
            background: 'rgba(10, 10, 18, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            {isHost ? (
              <button
                onClick={handleStartGame}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Play size={18} fill="#fff" /> BẮT ĐẦU VÁN ĐẤU ({gameState.players.length} người)
              </button>
            ) : (
              <button
                onClick={handleToggleReady}
                style={{
                  flex: 1,
                  background: me?.isReady ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: me?.isReady ? '1px solid #ef4444' : 'none',
                  color: me?.isReady ? '#fca5a5' : '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                {me?.isReady ? 'HỦY SẴN SÀNG' : 'TÔI ĐÃ SẴN SÀNG'}
              </button>
            )}

            <button
              onClick={() => setShowLeaveRoomConfirm(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ef4444',
                padding: '14px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Rời phòng"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        )
      )}

      {/* VIEW 5: CHẾ ĐỘ KHÁN GIẢ (SPECTATOR LIVE VIEW) */}
      {activeView === 'SPECTATOR' && gameState && spectatorSession && (
        <SpectatorLiveView
          gameState={gameState}
          spectatorName={playerName.trim() || 'Khán Giả'}
          onLeave={() => {
            roomManager.leaveSpectator(spectatorSession.roomId, spectatorSession.spectatorId);
            setSpectatorSession(null);
            setGameState(null);
            setActiveView('TABLES');
          }}
        />
      )}

      {/* Modal xác nhận rời phòng chờ */}
      <ConfirmModal
        isOpen={showLeaveRoomConfirm}
        title="Rời Khỏi Phòng Chờ?"
        message={isHost 
          ? "Bạn đang là Chủ Phòng. Nếu bạn rời đi, phòng chờ sẽ bị hủy hoặc quyền chủ phòng sẽ được chuyển giao."
          : "Bạn có chắc chắn muốn rời khỏi phòng chờ này?"}
        confirmText="Rời Phòng"
        cancelText="Ở Lại"
        variant="danger"
        onConfirm={() => {
          setShowLeaveRoomConfirm(false);
          handleLeaveRoom();
        }}
        onCancel={() => setShowLeaveRoomConfirm(false)}
      />

      {/* Modal chọn Avatar Ma Sói Huyền Bí */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        selectedAvatarId={selectedAvatarObj.id}
        onSelect={(avatar) => setSelectedAvatarObj(avatar)}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      {/* Modal xác thực người thật chống bot tự động */}
      <HumanVerifyModal
        isOpen={isHumanModalOpen}
        onSuccess={handleHumanVerifySuccess}
        onCancel={() => {
          setIsHumanModalOpen(false);
          setPendingJoinTable(null);
        }}
      />

      {/* Modal Bảng Xếp Hạng Thợ Săn */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Modal Hồ Sơ & Kho Huy Hiệu */}
      <HunterProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Modal Huấn Luyện Thợ Săn Solo với AI Bots */}
      <SoloPracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        onStartPractice={handleStartSoloPractice}
      />
    </div>
  );
};
