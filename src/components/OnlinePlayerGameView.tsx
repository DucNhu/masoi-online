import React, { useState, useRef, useEffect } from 'react';
import { ClientGameState } from '../types/multiplayer';
import { ROLE_DEFINITIONS } from '../data/roles';
import { roomManager } from '../logic/roomManager';
import { voiceEngine } from '../logic/webrtcVoiceMesh';
import { soundEffects, playSpatialSound } from '../utils/soundEffects';
import { ConfirmModal } from './ConfirmModal';
import { ARENA_THEMES } from '../constants/arenaThemes';
import { 
  Eye, 
  Moon, 
  Sun, 
  Shield, 
  Crosshair, 
  Users, 
  Heart, 
  Skull, 
  LogOut, 
  Send, 
  Trophy, 
  Vote,
  Mic,
  MicOff,
  Scroll,
  MessageSquare,
  Sparkles,
  X,
  Crown,
  Volume2
} from 'lucide-react';
import { EmotePicker } from './EmotePicker';
import { MatchHistoryModal } from './MatchHistoryModal';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import { ROLE_CARD_IMAGES, CARD_BACK_IMAGE, PHASE_BACKGROUNDS } from '../constants/assets';

interface Props {
  gameState: ClientGameState;
  onLeaveRoom: () => void;
}

export const OnlinePlayerGameView: React.FC<Props> = ({ gameState, onLeaveRoom }) => {
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isRoleCardFlipped, setIsRoleCardFlipped] = useState<boolean>(false);

  // Mục tiêu được chọn tương tác trực tiếp 1 chạm trên Bàn Đấu (Dùng chung cho cả Đêm và Ngày)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [nightActionSubmitted, setNightActionSubmitted] = useState<boolean>(false);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);

  // Micro & Voice Control
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isMicLoading, setIsMicLoading] = useState<boolean>(false);

  // Mobile Tabs: ARENA (Bàn Chơi) vs CHAT (Trò Chuyện)
  const [mobileTab, setMobileTab] = useState<'ARENA' | 'CHAT'>('ARENA');

  // Chat Tab & Input
  const [activeChatTab, setActiveChatTab] = useState<'PUBLIC' | 'WOLF' | 'DEAD'>('PUBLIC');
  const [chatInputText, setChatInputText] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Floating Mini Chat Toast (hiển thị tin mới thoáng qua khi đang ở tab Arena)
  const [miniToast, setMiniToast] = useState<{ sender: string; avatar: string; text: string } | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const lastMsgCountRef = useRef<number>(gameState.chatMessages.length);

  // Lưu trữ phase trước đó để tự động reset cờ khi sang pha mới
  const [prevPhase, setPrevPhase] = useState<string>(gameState.phase);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isAlive = me?.isAlive ?? true;
  const isHost = me?.isHost ?? false;
  const myRoleDef = ROLE_DEFINITIONS[gameState.myRole] || ROLE_DEFINITIONS.VILLAGER;
  
  const isNight = gameState.phase === 'NIGHT';
  const isDayDiscussion = gameState.phase === 'DAY_DISCUSSION';
  const isDayVoting = gameState.phase === 'DAY_VOTING';
  const isGameOver = gameState.phase === 'GAME_OVER';

  const isWolfSide = gameState.myRole === 'WEREWOLF' || gameState.myRole === 'MINION';

  // Đồng bộ reset cờ và phát âm thanh khi server đổi phase
  if (gameState.phase !== prevPhase) {
    setPrevPhase(gameState.phase);
    setSelectedTargetId(null);
    if (gameState.phase === 'NIGHT') {
      setNightActionSubmitted(false);
      setIsMuted(true);
      soundEffects.playWolfHowl();
    }
    if (gameState.phase === 'DAY_DISCUSSION') {
      soundEffects.playRoosterMorning();
    }
    if (gameState.phase === 'DAY_VOTING') {
      setVoteSubmitted(false);
      soundEffects.playCourtGavel();
    }
  }

  // Floating Toast thông báo tin nhắn mới khi đang ở Tab Arena
  useEffect(() => {
    if (gameState.chatMessages.length > lastMsgCountRef.current) {
      const latestMsg = gameState.chatMessages[gameState.chatMessages.length - 1];
      lastMsgCountRef.current = gameState.chatMessages.length;

      // Chỉ hiển thị toast nếu là tin của người khác và thuộc kênh hợp lệ
      if (latestMsg && latestMsg.senderId !== gameState.myPlayerId) {
        if (mobileTab === 'ARENA') {
          setMiniToast({
            sender: latestMsg.senderName,
            avatar: latestMsg.senderAvatar,
            text: latestMsg.text,
          });
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setMiniToast(null);
          }, 3500);
        }
      }
    }
  }, [gameState.chatMessages, gameState.myPlayerId, mobileTab]);

  // Xử lý bật/tắt micro thu âm thực tế & phát loa P2P
  const handleToggleMic = async () => {
    if (isNight && !isWolfSide) {
      soundEffects.triggerHaptic('heavy');
      alert('🔒 Night Auto-Mute: Đêm tối cả làng ngủ say, micro bị khóa để bảo toàn tĩnh lặng.');
      return;
    }
    if (!isAlive) {
      soundEffects.triggerHaptic('heavy');
      alert('👻 Âm dương cách biệt: Linh hồn đã hy sinh không thể phát giọng nói tới người sống.');
      return;
    }

    if (isMicLoading) return;

    const nextMuted = !isMuted;
    if (!nextMuted) {
      setIsMicLoading(true);
      try {
        const peerIds = gameState.players
          .map((p) => p.peerId)
          .filter((id): id is string => Boolean(id) && id !== gameState.myPlayerId);

        await roomManager.startVoiceBroadcast(gameState.roomId, gameState.myPlayerId, peerIds);
        setIsMuted(false);
        soundEffects.triggerHaptic('medium');
      } catch (err: any) {
        console.warn('[Mic] Lỗi mở micro:', err);
        alert(err.message || 'Không thể mở Micro. Vui lòng cấp quyền Micro trên trình duyệt để nói chuyện.');
        setIsMuted(true);
      } finally {
        setIsMicLoading(false);
      }
    } else {
      roomManager.stopVoiceBroadcast(gameState.roomId, gameState.myPlayerId);
      setIsMuted(true);
      soundEffects.triggerHaptic('light');
    }
  };

  // Lắng nghe trạng thái nói của Micro (VAD) để nhấp nháy UI
  useEffect(() => {
    voiceEngine.onSpeaking((isSpeaking) => {
      roomManager.setVoiceState(gameState.roomId, gameState.myPlayerId, isSpeaking, isMuted);
    });
  }, [gameState.roomId, gameState.myPlayerId, isMuted]);

  // Tự động áp dụng phân quyền âm thanh khi phase hoặc vai trò thay đổi
  useEffect(() => {
    voiceEngine.applyGameAudioRules({
      isNight,
      myRole: gameState.myRole,
      isAlive,
      players: gameState.players,
    });
  }, [isNight, gameState.myRole, isAlive, gameState.players]);

  // Giải phóng micro khi rời phòng
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      voiceEngine.destroy();
    };
  }, []);

  // Tự động cuộn chat xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chatMessages, mobileTab, activeChatTab]);

  // Tab chat hợp lệ theo vai trò và trạng thái sống chết
  const effectiveChatTab = !isAlive ? 'DEAD' : (activeChatTab === 'DEAD' ? 'PUBLIC' : activeChatTab);

  // Danh sách người chơi còn sống
  const livingPlayers = gameState.players.filter((p) => p.isAlive);

  // Xử lý gửi hành động ban đêm (Sói cắn, Tiên tri soi, Bảo vệ hộ tống)
  const handleSubmitNightAction = () => {
    if (!selectedTargetId) return;
    soundEffects.triggerHaptic('medium');

    let actionType = '';
    if (gameState.myRole === 'WEREWOLF') actionType = 'WEREWOLF_KILL';
    else if (gameState.myRole === 'SEER') actionType = 'SEER_SCAN';
    else if (gameState.myRole === 'BODYGUARD') actionType = 'PROTECT';

    if (actionType) {
      roomManager.submitNightAction(gameState.roomId, gameState.myPlayerId, {
        actionType,
        targetId: selectedTargetId,
      });
      setNightActionSubmitted(true);

      // Phát âm thanh không gian 3D nếu là Sói cắn đêm
      if (actionType === 'WEREWOLF_KILL' && selectedTargetId && me) {
        const targetP = gameState.players.find((p) => p.id === selectedTargetId);
        if (targetP) {
          playSpatialSound('wolf', targetP.seatNumber, me.seatNumber, gameState.players.length || 8);
        }
      }
    }
  };

  // Xử lý bỏ phiếu ban ngày với 3D Spatial Audio
  const handleCastVote = (targetId: string | null) => {
    soundEffects.triggerHaptic('medium');
    setSelectedTargetId(targetId);
    roomManager.castVote(gameState.roomId, gameState.myPlayerId, targetId);
    setVoteSubmitted(true);

    if (targetId && me) {
      const targetP = gameState.players.find((p) => p.id === targetId);
      if (targetP) {
        playSpatialSound('vote', targetP.seatNumber, me.seatNumber, gameState.players.length || 8);
      }
    }
  };

  // Xử lý gửi tin nhắn chat
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInputText.trim();
    if (!text) return;

    try {
      roomManager.sendChatMessage(gameState.roomId, gameState.myPlayerId, text, effectiveChatTab);
      setChatInputText('');
      soundEffects.triggerHaptic('light');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Không thể gửi tin nhắn.');
    }
  };

  // Xử lý khi chạm vào một thẻ người chơi trên Bàn Đấu (1-Tap direct action)
  const handlePlayerCardTap = (playerId: string) => {
    soundEffects.triggerHaptic('light');
    
    // Nếu là pha đêm và có quyền hành động
    if (isNight && isAlive) {
      if (gameState.myRole === 'WEREWOLF' || gameState.myRole === 'SEER' || gameState.myRole === 'BODYGUARD') {
        if (!nightActionSubmitted) {
          setSelectedTargetId(playerId === selectedTargetId ? null : playerId);
        }
      }
    } 
    // Nếu là pha ngày bỏ phiếu
    else if (isDayVoting && isAlive && !me?.idiotRevealed) {
      handleCastVote(playerId === selectedTargetId ? null : playerId);
    }
  };

  const arenaTheme = ARENA_THEMES[gameState.arenaTheme || 'BLOOD_MOON'] || ARENA_THEMES.BLOOD_MOON;

  // Lấy đối tượng người chơi đang được chọn
  const selectedTargetPlayer = gameState.players.find(p => p.id === selectedTargetId);

  // Số lượng tin nhắn chưa đọc cho mobile badge
  const unreadChatCount = gameState.chatMessages.filter(m => m.channel === effectiveChatTab).length;

  return (
    <div style={{
      height: '100dvh',
      maxHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#fff',
      background: arenaTheme.backgroundGradient,
      backgroundImage: `linear-gradient(rgba(10, 10, 18, 0.88), rgba(10, 10, 18, 0.94)), url(${isNight ? PHASE_BACKGROUNDS.NIGHT : isDayVoting ? PHASE_BACKGROUNDS.DAY_VOTING : PHASE_BACKGROUNDS.DAY_DAWN})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: 'Be Vietnam Pro, Montserrat, sans-serif',
      position: 'relative',
    }}>
      {/* 1. COMPACT APP HEADER (~48px) - Zero scroll header */}
      <header style={{
        height: '48px',
        minHeight: '48px',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 10, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${arenaTheme.borderColor}`,
        zIndex: 20,
      }}>
        {/* Nút Vai trò rút gọn (Chạm để mở Full Card Dialog) */}
        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setIsRoleCardFlipped(false);
            setShowRoleModal(true);
          }}
          title="Xem lá bài vai trò & kỹ năng"
          style={{
            background: myRoleDef.badgeBg,
            border: `1.5px solid ${myRoleDef.color}`,
            borderRadius: '12px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: '#fff',
            boxShadow: `0 0 10px ${myRoleDef.color}40`,
          }}
        >
          {/* Card Thumbnail */}
          <div style={{
            width: '26px',
            height: '34px',
            borderRadius: '5px',
            overflow: 'hidden',
            border: `1px solid ${myRoleDef.color}`,
            flexShrink: 0,
            background: '#0a0a14',
          }}>
            <img 
              src={ROLE_CARD_IMAGES[gameState.myRole] || CARD_BACK_IMAGE} 
              alt={myRoleDef.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.62rem', color: myRoleDef.color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              [{myRoleDef.defaultRank || '?'}] {myRoleDef.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: isAlive ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
              {isAlive ? 'Sống' : 'Hy Sinh'}
            </div>
          </div>
        </button>

        {/* Phase Pill trung tâm & Bộ đếm giờ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isNight ? 'rgba(99, 102, 241, 0.2)' : isGameOver ? 'rgba(234, 179, 8, 0.2)' : 'rgba(249, 115, 22, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '4px 10px',
          borderRadius: '20px',
        }}>
          {isNight && <Moon size={15} color="#a5b4fc" />}
          {isDayDiscussion && <Sun size={15} color="#fde047" />}
          {isDayVoting && <Vote size={15} color="#f97316" />}
          {isGameOver && <Trophy size={15} color="#facc15" />}
          
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
            {isNight && `Đêm ${gameState.dayNumber}`}
            {isDayDiscussion && `Ngày ${gameState.dayNumber}`}
            {isDayVoting && `Tòa Án`}
            {isGameOver && `Kết Thúc`}
          </span>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 900,
            color: gameState.timerSeconds <= 10 ? '#ef4444' : '#e2e8f0',
            fontFamily: 'monospace',
            background: 'rgba(0,0,0,0.3)',
            padding: '1px 6px',
            borderRadius: '6px',
          }}>
            {gameState.timerSeconds}s
          </span>

          {/* Quick Host Action ngay trên Header */}
          {isHost && !isGameOver && (
            <button
              onClick={() => {
                soundEffects.triggerHaptic('medium');
                if (isNight) roomManager.resolveNightToDay(gameState.roomId);
                else if (isDayDiscussion) roomManager.startDayVoting(gameState.roomId);
                else if (isDayVoting) roomManager.concludeDayVoting(gameState.roomId);
              }}
              title="Chuyển nhanh sang pha tiếp theo"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              ⏩ Pha
            </button>
          )}
        </div>

        {/* Cụm công cụ bên phải: Mic, Nhật Ký, Rời Trận */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Nút Mic Voice trực quan với sóng âm */}
          <button
            onClick={handleToggleMic}
            disabled={isMicLoading}
            style={{
              background: !isMuted ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.15)',
              border: !isMuted ? '1px solid #22c55e' : '1px solid rgba(239, 68, 68, 0.3)',
              color: !isMuted ? '#4ade80' : '#fca5a5',
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: isMicLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={!isMuted ? 'Đang bật mic (Chạm để tắt)' : 'Đang tắt mic (Chạm để bật)'}
          >
            {!isMuted ? <Mic size={14} color="#4ade80" /> : <MicOff size={14} color="#fca5a5" />}
            {!isMuted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '12px' }}>
                <span className="wave-bar-1" style={{ width: '2px', background: '#4ade80', borderRadius: '1px' }} />
                <span className="wave-bar-2" style={{ width: '2px', background: '#4ade80', borderRadius: '1px' }} />
                <span className="wave-bar-3" style={{ width: '2px', background: '#4ade80', borderRadius: '1px' }} />
              </div>
            )}
          </button>

          {/* Nút Nhật Ký Trận */}
          <button
            onClick={() => {
              soundEffects.triggerHaptic('light');
              setShowHistoryModal(true);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Nhật ký trận đấu"
          >
            <Scroll size={14} />
          </button>

          {/* Nút Rời Trận */}
          <button
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              padding: '5px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Rời phòng"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 2. MOBILE TAB SELECTOR (Chỉ hiển thị trên mobile < 768px, giúp không phải cuộn) */}
      <div 
        className="mobile-tab-bar"
        style={{
          display: 'flex',
          background: 'rgba(15, 17, 28, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4px 8px',
          gap: '6px',
        }}
      >
        <button
          onClick={() => setMobileTab('ARENA')}
          style={{
            flex: 1,
            background: mobileTab === 'ARENA' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: mobileTab === 'ARENA' ? '1px solid #6366f1' : '1px solid transparent',
            color: mobileTab === 'ARENA' ? '#818cf8' : '#94a3b8',
            padding: '6px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Users size={14} /> Bàn Đấu ({livingPlayers.length}/{gameState.players.length})
        </button>

        <button
          onClick={() => setMobileTab('CHAT')}
          style={{
            flex: 1,
            background: mobileTab === 'CHAT' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            border: mobileTab === 'CHAT' ? '1px solid #38bdf8' : '1px solid transparent',
            color: mobileTab === 'CHAT' ? '#38bdf8' : '#94a3b8',
            padding: '6px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            position: 'relative',
          }}
        >
          <MessageSquare size={14} /> Trò Chuyện
          {unreadChatCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '10px',
            }}>
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. MAIN ARENA CONTENT VIEWPORT (Tự động thích ứng, Dual-Pane trên Desktop) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* KHU VỰC 1: BÀN ĐẤU ARENA (PLAYER SEAT GRID) */}
        <section style={{
          flex: 1,
          display: (mobileTab === 'ARENA' || window.innerWidth >= 768) ? 'flex' : 'none',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          padding: '10px',
          position: 'relative',
        }}>
          {/* Lưới Ghế Ngồi Người Chơi (Interactive Seat Grid) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: gameState.players.length <= 6 
              ? 'repeat(2, 1fr)' 
              : gameState.players.length <= 10 
              ? 'repeat(3, 1fr)' 
              : 'repeat(auto-fit, minmax(105px, 1fr))',
            gap: '8px',
            overflowY: 'auto',
            alignContent: 'start',
            padding: '2px',
          }}>
            {gameState.players.map((p) => {
              const isSelected = selectedTargetId === p.id;
              const isMe = p.id === gameState.myPlayerId;
              const isDead = !p.isAlive;
              const voteCount = gameState.voteTally?.[p.id] || 0;
              const isTeammateWolf = isWolfSide && gameState.teamMates.includes(p.id) && !isMe;
              const isLover = gameState.couplePartnerId === p.id;
              const revealedRole = gameState.revealedRoles[p.id];

              // Quyết định class và hiệu ứng viền cho thẻ
              let selectClass = '';
              if (isSelected) {
                selectClass = (isNight && gameState.myRole === 'WEREWOLF') ? 'wolf-target-selected' : 'neon-target-selected';
              }

              return (
                <div
                  key={p.id}
                  onClick={() => handlePlayerCardTap(p.id)}
                  className={selectClass}
                  style={{
                    position: 'relative',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(30, 27, 75, 0.8))'
                      : isDead
                      ? 'rgba(15, 17, 26, 0.5)'
                      : isTeammateWolf
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(22, 26, 42, 0.7)',
                    border: isSelected
                      ? '2px solid #818cf8'
                      : isTeammateWolf
                      ? '1.5px solid rgba(239, 68, 68, 0.6)'
                      : isLover
                      ? '1.5px solid #ec4899'
                      : isMe
                      ? '1.5px solid rgba(56, 189, 248, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (isAlive && !isDead) ? 'pointer' : 'default',
                    opacity: isDead ? 0.45 : 1,
                    transition: 'all 0.18s ease',
                    boxShadow: p.isSpeaking ? '0 0 16px rgba(34, 197, 94, 0.5)' : '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Badge số ghế ở góc trái */}
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    color: '#94a3b8',
                  }}>
                    #{p.seatNumber}
                  </div>

                  {/* Badge biểu tượng vai trò đồng đội hoặc chức sắc */}
                  <div style={{ position: 'absolute', top: '4px', right: '6px', display: 'flex', gap: '3px' }}>
                    {p.isHost && <Crown size={12} color="#f59e0b" />}
                    {(gameState.mayorPlayerId === p.id || p.isMayor) && <span title="Thị trưởng x2 phiếu">👑</span>}
                    {isTeammateWolf && <span title="Đồng đội Sói">🐺</span>}
                    {isLover && <span title="Người yêu">💘</span>}
                    {p.idiotRevealed && <span title="Kẻ ngốc lật bài">🃏</span>}
                  </div>

                  {/* Live Vote Tally Badge góc phải trên */}
                  {voteCount > 0 && isDayVoting && (
                    <div style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.8)',
                    }}>
                      🗳️ {voteCount}
                    </div>
                  )}

                  {/* Avatar lớn trực quan */}
                  <div style={{ position: 'relative', margin: '4px 0 2px 0' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isDead ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.06)',
                      border: p.isSpeaking ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      filter: isDead ? 'grayscale(1)' : 'none',
                    }}>
                      {p.avatar}
                    </div>

                    {/* Sóng âm khi đang nói chuyện qua WebRTC Voice */}
                    {p.isSpeaking && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '2px',
                        height: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '1px 3px',
                        borderRadius: '4px',
                      }}>
                        <span className="wave-bar-1" style={{ width: '2px', background: '#4ade80' }} />
                        <span className="wave-bar-2" style={{ width: '2px', background: '#4ade80' }} />
                        <span className="wave-bar-3" style={{ width: '2px', background: '#4ade80' }} />
                      </div>
                    )}

                    {/* Huy hiệu Đã Hy Sinh */}
                    {isDead && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-4px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        padding: '2px',
                        display: 'flex',
                      }}>
                        <Skull size={10} color="#fff" />
                      </div>
                    )}
                  </div>

                  {/* Tên người chơi */}
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: isMe ? '#38bdf8' : '#f8fafc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    textAlign: 'center',
                  }}>
                    {p.name} {isMe && '⭐'}
                  </div>

                  {/* Trạng thái vắn tắt hoặc Vai trò lật mở */}
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>
                    {isDead ? (
                      <span style={{ color: '#f87171' }}>{revealedRole ? ROLE_DEFINITIONS[revealedRole]?.name : 'Đã chết'}</span>
                    ) : (
                      isDayVoting ? (p.hasVoted ? '✓ Đã vote' : '⏳ Suy nghĩ') : (isMe ? 'Bạn' : 'Sống')
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Mini Chat Toast (Bay lên thoáng qua trên Bàn chơi khi có tin mới) */}
          {miniToast && (
            <div 
              className="floating-mini-toast"
              onClick={() => setMobileTab('CHAT')}
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                right: '16px',
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{miniToast.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800 }}>{miniToast.sender}:</div>
                <div style={{ fontSize: '0.8rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {miniToast.text}
                </div>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Chạm để chat 💬</span>
            </div>
          )}
        </section>

        {/* KHU VỰC 2: PHÒNG CHAT & EMOTES (Mobile Tab hoặc Dual-Pane trên Desktop) */}
        <section style={{
          width: window.innerWidth >= 768 ? '360px' : '100%',
          display: (mobileTab === 'CHAT' || window.innerWidth >= 768) ? 'flex' : 'none',
          flexDirection: 'column',
          minHeight: 0,
          background: 'rgba(12, 14, 24, 0.95)',
          borderLeft: window.innerWidth >= 768 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          overflow: 'hidden',
        }}>
          {/* Sub-Tabs Kênh Chat (Làng / Hang Sói / Cõi Âm) */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            {isAlive && (
              <button
                onClick={() => setActiveChatTab('PUBLIC')}
                style={{
                  flex: 1,
                  background: effectiveChatTab === 'PUBLIC' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  border: effectiveChatTab === 'PUBLIC' ? '1px solid #38bdf8' : '1px solid transparent',
                  color: effectiveChatTab === 'PUBLIC' ? '#38bdf8' : '#94a3b8',
                  padding: '5px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🏘️ Làng
              </button>
            )}

            {isAlive && isWolfSide && (
              <button
                onClick={() => setActiveChatTab('WOLF')}
                style={{
                  flex: 1,
                  background: effectiveChatTab === 'WOLF' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: effectiveChatTab === 'WOLF' ? '1px solid #ef4444' : '1px solid transparent',
                  color: effectiveChatTab === 'WOLF' ? '#ef4444' : '#94a3b8',
                  padding: '5px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🐺 Sói
              </button>
            )}

            {!isAlive && (
              <button
                onClick={() => setActiveChatTab('DEAD')}
                style={{
                  flex: 1,
                  background: effectiveChatTab === 'DEAD' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  border: effectiveChatTab === 'DEAD' ? '1px solid #a855f7' : '1px solid transparent',
                  color: effectiveChatTab === 'DEAD' ? '#a855f7' : '#94a3b8',
                  padding: '5px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👻 Cõi Âm
              </button>
            )}
          </div>

          {/* Khung Tin Nhắn Realtime */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {gameState.chatMessages.filter((m) => m.channel === effectiveChatTab).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', margin: 'auto' }}>
                Chưa có tin nhắn trong kênh này...
              </div>
            ) : (
              gameState.chatMessages
                .filter((m) => m.channel === effectiveChatTab)
                .map((m) => {
                  const isMe = m.senderId === gameState.myPlayerId;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>
                        {m.senderAvatar} {m.senderName}
                      </div>
                      <div style={{
                        background: isMe ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(255,255,255,0.08)',
                        border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        fontSize: '0.82rem',
                        maxWidth: '85%',
                        wordBreak: 'break-word',
                      }}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Ô Nhập Tin Nhắn & Bộ Chọn Biểu Cảm */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '8px 10px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <EmotePicker
              disabled={(effectiveChatTab === 'PUBLIC' && isNight) || (effectiveChatTab === 'PUBLIC' && !isAlive)}
              onSelectEmote={(item) => {
                try {
                  soundEffects.triggerHaptic('medium');
                  roomManager.sendChatMessage(
                    gameState.roomId,
                    gameState.myPlayerId,
                    `${item.emoji} [${item.label}]`,
                    effectiveChatTab
                  );
                } catch {
                  // ignore
                }
              }}
            />
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder={
                effectiveChatTab === 'PUBLIC' && isNight 
                  ? 'Đêm tối làng ngủ say...' 
                  : effectiveChatTab === 'PUBLIC' && !isAlive
                  ? 'Linh hồn không thể chat làng...'
                  : `Nhập tin nhắn (${effectiveChatTab})...`
              }
              disabled={(effectiveChatTab === 'PUBLIC' && isNight) || (effectiveChatTab === 'PUBLIC' && !isAlive)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '8px 10px',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={(effectiveChatTab === 'PUBLIC' && isNight) || (effectiveChatTab === 'PUBLIC' && !isAlive)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                border: 'none',
                borderRadius: '8px',
                padding: '0 12px',
                color: '#fff',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </section>
      </div>

      {/* 4. BOTTOM ACTION DOCK (~60px) - Thanh Hành Động 1 Chạm Cố Định */}
      <footer style={{
        height: '62px',
        minHeight: '62px',
        background: 'rgba(10, 10, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '10px',
        zIndex: 20,
      }}>
        {/* BAN ĐÊM (NIGHT ACTIONS) */}
        {isNight && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gameState.myRole === 'VILLAGER' ? (
              <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Moon size={15} color="#818cf8" /> Đêm Nay Bạn Chỉ Cần Ngủ Say • Chờ Trời Sáng
              </div>
            ) : !isAlive ? (
              <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                👻 Bạn đã hy sinh • Quan sát diễn biến từ cõi âm
              </div>
            ) : nightActionSubmitted ? (
              <div style={{
                flex: 1,
                textAlign: 'center',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '8px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
              }}>
                ✓ Đã thực hiện hành động đêm! Đang đợi cả làng thức giấc...
              </div>
            ) : (
              <button
                onClick={handleSubmitNightAction}
                disabled={!selectedTargetId}
                style={{
                  flex: 1,
                  height: '44px',
                  background: selectedTargetId 
                    ? (gameState.myRole === 'WEREWOLF' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #6366f1, #4f46e5)')
                    : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '10px',
                  color: selectedTargetId ? '#fff' : '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  cursor: selectedTargetId ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: selectedTargetId ? '0 4px 14px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {gameState.myRole === 'WEREWOLF' && <Crosshair size={16} />}
                {gameState.myRole === 'SEER' && <Eye size={16} />}
                {gameState.myRole === 'BODYGUARD' && <Shield size={16} />}

                {selectedTargetPlayer ? (
                  <span>
                    Xác Nhận: #{selectedTargetPlayer.seatNumber} {selectedTargetPlayer.name}
                  </span>
                ) : (
                  <span>👆 Chạm 1 người trên bàn để chọn mục tiêu</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* BAN NGÀY THẢO LUẬN (DAY DISCUSSION) */}
        {isDayDiscussion && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={15} color="#facc15" />
              <span>Thảo luận tìm kẻ khả nghi • Bật mic để tranh luận</span>
            </div>
            {isHost && (
              <button
                onClick={() => roomManager.startDayVoting(gameState.roomId)}
                style={{
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Vote size={14} /> Vào Bỏ Phiếu
              </button>
            )}
          </div>
        )}

        {/* BAN NGÀY BỎ PHIẾU (DAY VOTING) */}
        {isDayVoting && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {me?.idiotRevealed ? (
              <div style={{ flex: 1, textAlign: 'center', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 700 }}>
                🃏 Kẻ Ngốc Lật Bài: Bạn bị tước quyền bỏ phiếu
              </div>
            ) : !isAlive ? (
              <div style={{ flex: 1, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                👻 Đã hy sinh • Không thể bỏ phiếu
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleCastVote(null)}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    background: selectedTargetId === null && voteSubmitted ? 'rgba(148, 163, 184, 0.25)' : 'rgba(255,255,255,0.06)',
                    border: selectedTargetId === null && voteSubmitted ? '1px solid #94a3b8' : '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🕊️ Phiếu Trắng
                </button>

                <div style={{
                  flex: 1,
                  height: '42px',
                  background: selectedTargetPlayer ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedTargetPlayer ? '#fff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  <Vote size={15} />
                  {selectedTargetPlayer ? (
                    <span>Đã vote: #{selectedTargetPlayer.seatNumber} {selectedTargetPlayer.name}</span>
                  ) : (
                    <span>Chạm người trên bàn để Vote</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* KẾT THÚC TRẬN ĐẤU (GAME OVER) */}
        {isGameOver && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#facc15' }}>
              🏆 Ván Đấu Đã Kết Thúc!
            </span>
            <button
              onClick={onLeaveRoom}
              style={{
                background: '#fff',
                color: '#0f172a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Về Sảnh Chờ
            </button>
          </div>
        )}
      </footer>

      {/* 5. MODAL LÁ BÀI THẦN THOẠI TRỰC QUAN (TRADING CARD VIEW) */}
      {showRoleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div 
            className="holo-card-shine"
            style={{
              width: '100%',
              maxWidth: '340px',
              background: 'linear-gradient(135deg, #181b2a, #0b0d17)',
              border: `2px solid ${myRoleDef.color}`,
              borderRadius: '24px',
              padding: '24px 20px',
              position: 'relative',
              boxShadow: `0 0 40px ${myRoleDef.color}50`,
              textAlign: 'center',
            }}
          >
            {/* Nút đóng */}
            <button
              onClick={() => setShowRoleModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            {/* Rank và chất bài tú lơ khơ ở 2 góc */}
            <div style={{ position: 'absolute', top: '14px', left: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: myRoleDef.color, lineHeight: 1 }}>
                {myRoleDef.defaultRank}
              </div>
              <div style={{ fontSize: '0.9rem', color: myRoleDef.color }}>♠</div>
            </div>

            {/* Lá Bài Tarot Nghệ Thuật (Chạm để Lật úp/Mở - Privacy Mode) */}
            <div 
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setIsRoleCardFlipped(!isRoleCardFlipped);
              }}
              title="Chạm để lật bài (Ẩn / Hiện để chống nhìn trộm)"
              style={{
                width: '180px',
                height: '240px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: `2px solid ${myRoleDef.color}`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 24px ${myRoleDef.color}50`,
                margin: '12px auto 14px auto',
                cursor: 'pointer',
                position: 'relative',
                backgroundColor: '#0a0a14',
                transition: 'all 0.25s ease',
              }}
            >
              <img 
                src={isRoleCardFlipped ? CARD_BACK_IMAGE : (ROLE_CARD_IMAGES[gameState.myRole] || CARD_BACK_IMAGE)} 
                alt={myRoleDef.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {!isRoleCardFlipped && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(4px)',
                  color: myRoleDef.color,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  border: `1px solid ${myRoleDef.color}80`,
                }}>
                  Lá {myRoleDef.defaultRank || '?'}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '6px',
                left: 0,
                right: 0,
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                padding: '4px 0 2px 0',
              }}>
                {isRoleCardFlipped ? '🔄 Chạm để mở bài' : '🔄 Chạm để úp bài (Che)'}
              </div>
            </div>

            {/* Tên vai trò & Phe phái */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 4px 0' }}>
              {myRoleDef.name}
            </h2>
            <div style={{
              display: 'inline-block',
              background: myRoleDef.badgeBg,
              color: myRoleDef.color,
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: '20px',
              marginBottom: '16px',
            }}>
              {myRoleDef.team === 'WEREWOLF' ? '🐺 PHE MA SÓI' : myRoleDef.team === 'VILLAGE' ? '👤 PHE DÂN LÀNG' : '✨ PHE THỨ BA'}
            </div>

            {/* Tóm tắt kỹ năng dạng icon */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '12px',
              textAlign: 'left',
              fontSize: '0.82rem',
              color: '#cbd5e1',
              lineHeight: 1.5,
              marginBottom: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color={myRoleDef.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{myRoleDef.description}</span>
              </div>
            </div>

            {/* Đồng đội ma sói (nếu có) */}
            {gameState.teamMates.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '0.78rem',
                color: '#fca5a5',
                marginBottom: '10px',
                textAlign: 'left',
              }}>
                🐺 Đồng đội Sói: <strong>{gameState.players.filter(p => gameState.teamMates.includes(p.id)).map(p => p.name).join(', ')}</strong>
              </div>
            )}

            {/* Người yêu (nếu có) */}
            {gameState.couplePartnerId && (
              <div style={{
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '0.78rem',
                color: '#fbcfe8',
                marginBottom: '10px',
                textAlign: 'left',
              }}>
                💘 Người yêu: <strong>{gameState.players.find(p => p.id === gameState.couplePartnerId)?.name}</strong>
              </div>
            )}

            {/* Kết quả soi tiên tri gần nhất */}
            {gameState.seerScanResult && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                padding: '8px 10px',
                fontSize: '0.78rem',
                color: '#7dd3fc',
                marginBottom: '10px',
                textAlign: 'left',
              }}>
                🔮 Kết quả soi: <strong>{gameState.players.find(p => p.id === gameState.seerScanResult?.targetId)?.name}</strong> là{' '}
                <strong style={{ color: gameState.seerScanResult.isWolf ? '#ef4444' : '#10b981' }}>
                  {gameState.seerScanResult.isWolf ? '🐺 MA SÓI' : '👤 NGƯỜI TỐT'}
                </strong>
              </div>
            )}

            <button
              onClick={() => setShowRoleModal(false)}
              style={{
                width: '100%',
                background: myRoleDef.color,
                color: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Đã Hiểu & Tiếp Tục
            </button>
          </div>
        </div>
      )}

      {/* Modal Nhật ký trận đấu */}
      <MatchHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        roomId={gameState.roomId}
        historyLog={roomManager.getServerRoom(gameState.roomId)?.historyLog || []}
        winner={gameState.winner}
      />

      {/* Modal xác nhận rời trận */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời Trận Đấu?"
        message="Bạn có chắc muốn rời phòng? Vai trò và điểm số của bạn trong ván chơi này sẽ bị hủy bỏ."
        confirmText="Rời Trận"
        cancelText="Ở Lại"
        variant="danger"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          onLeaveRoom();
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
};
