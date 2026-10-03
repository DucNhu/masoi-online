import React, { useState, useRef, useEffect } from 'react';
import { ClientGameState } from '../types/multiplayer';
import { ROLE_DEFINITIONS } from '../data/roles';
import { roomManager } from '../logic/roomManager';
import { soundEffects } from '../utils/soundEffects';
import { ConfirmModal } from './ConfirmModal';
import { 
  Eye, 
  EyeOff, 
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
  Scroll
} from 'lucide-react';
import { EmotePicker } from './EmotePicker';
import { MatchHistoryModal } from './MatchHistoryModal';

interface Props {
  gameState: ClientGameState;
  onLeaveRoom: () => void;
}

export const OnlinePlayerGameView: React.FC<Props> = ({ gameState, onLeaveRoom }) => {
  const [showRoleDetails, setShowRoleDetails] = useState<boolean>(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedNightTargetId, setSelectedNightTargetId] = useState<string | null>(null);
  const [nightActionSubmitted, setNightActionSubmitted] = useState<boolean>(false);
  
  // Bỏ phiếu ban ngày
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);

  // Micro & Voice Control
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Lưu trữ phase trước đó để tự động reset cờ khi sang pha mới
  const [prevPhase, setPrevPhase] = useState<string>(gameState.phase);

  // Chat Tab & Input
  const [activeChatTab, setActiveChatTab] = useState<'PUBLIC' | 'WOLF' | 'DEAD'>('PUBLIC');
  const [chatInputText, setChatInputText] = useState<string>('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isAlive = me?.isAlive ?? true;
  const isHost = me?.isHost ?? false;
  const myRoleDef = ROLE_DEFINITIONS[gameState.myRole] || ROLE_DEFINITIONS.VILLAGER;
  
  const isNight = gameState.phase === 'NIGHT';
  const isDayDiscussion = gameState.phase === 'DAY_DISCUSSION';
  const isDayVoting = gameState.phase === 'DAY_VOTING';
  const isGameOver = gameState.phase === 'GAME_OVER';

  const isWolfSide = gameState.myRole === 'WEREWOLF' || gameState.myRole === 'MINION';

  // Đồng bộ reset cờ và phát âm thanh không gian khi server đổi phase
  if (gameState.phase !== prevPhase) {
    setPrevPhase(gameState.phase);
    if (gameState.phase === 'NIGHT') {
      setNightActionSubmitted(false);
      setSelectedNightTargetId(null);
      setIsMuted(true);
      soundEffects.playWolfHowl();
    }
    if (gameState.phase === 'DAY_DISCUSSION') {
      soundEffects.playRoosterMorning();
    }
    if (gameState.phase === 'DAY_VOTING') {
      setVoteSubmitted(false);
      setSelectedVoteTargetId(null);
      soundEffects.playCourtGavel();
    }
  }

  // Xử lý bật/tắt micro
  const handleToggleMic = () => {
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

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEffects.triggerHaptic('light');
    roomManager.setVoiceState(gameState.roomId, gameState.myPlayerId, !nextMuted, nextMuted);
  };

  // Tự động cuộn chat xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chatMessages]);

  // Tab chat hợp lệ
  const effectiveChatTab = !isAlive ? 'DEAD' : (activeChatTab === 'DEAD' ? 'PUBLIC' : activeChatTab);

  // Danh sách người chơi còn sống
  const livingPlayers = gameState.players.filter((p) => p.isAlive);

  // Xử lý gửi hành động ban đêm
  const handleSubmitNightAction = () => {
    if (!selectedNightTargetId) return;
    soundEffects.triggerHaptic('medium');

    let actionType = '';
    if (gameState.myRole === 'WEREWOLF') actionType = 'WEREWOLF_KILL';
    else if (gameState.myRole === 'SEER') actionType = 'SEER_SCAN';
    else if (gameState.myRole === 'BODYGUARD') actionType = 'PROTECT';

    if (actionType) {
      roomManager.submitNightAction(gameState.roomId, gameState.myPlayerId, {
        actionType,
        targetId: selectedNightTargetId,
      });
      setNightActionSubmitted(true);
    }
  };

  // Xử lý bỏ phiếu ban ngày
  const handleCastVote = (targetId: string | null) => {
    soundEffects.triggerHaptic('medium');
    setSelectedVoteTargetId(targetId);
    roomManager.castVote(gameState.roomId, gameState.myPlayerId, targetId);
    setVoteSubmitted(true);
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

  return (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', color: '#fff', paddingBottom: '80px' }}>
      {/* Header nhỏ hiển thị mã phòng & nút thoát */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>
          PHÒNG: <strong style={{ color: '#38bdf8' }}>{gameState.roomId}</strong> • BẠN: <strong style={{ color: '#fff' }}>{me?.name}</strong> {isHost && '👑'}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Nút Điều Khiển Micro */}
          <button
            onClick={handleToggleMic}
            style={{
              background: !isMuted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              border: !isMuted ? '1px solid #22c55e' : '1px solid rgba(239, 68, 68, 0.3)',
              color: !isMuted ? '#4ade80' : '#fca5a5',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {!isMuted ? <Mic size={14} color="#4ade80" /> : <MicOff size={14} color="#fca5a5" />}
            {!isMuted ? 'Mic BẬT' : 'Mic TẮT'}
          </button>

          <button
            onClick={() => {
              soundEffects.triggerHaptic('light');
              setShowHistoryModal(true);
            }}
            title="Xem nhật ký diễn biến ván đấu"
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Scroll size={13} /> Nhật Ký
          </button>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <LogOut size={12} /> Rời Trận
          </button>
        </div>
      </div>

      {/* THANH TRẠNG THÁI PHA & THỜI GIAN */}
      <div style={{
        background: isNight 
          ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' 
          : isGameOver 
          ? 'linear-gradient(135deg, #312e81, #064e3b)' 
          : 'linear-gradient(135deg, #78350f, #1e293b)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isNight ? 'rgba(99, 102, 241, 0.2)' : isGameOver ? 'rgba(234, 179, 8, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isNight && <Moon size={22} color="#a5b4fc" />}
            {isDayDiscussion && <Sun size={22} color="#fde047" />}
            {isDayVoting && <Vote size={22} color="#f97316" />}
            {isGameOver && <Trophy size={22} color="#facc15" />}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              {isNight && `ĐÊM THỨ ${gameState.dayNumber}`}
              {isDayDiscussion && `NGÀY THỨ ${gameState.dayNumber}: THẢO LUẬN`}
              {isDayVoting && `NGÀY THỨ ${gameState.dayNumber}: BỎ PHIẾU TREO CỔ`}
              {isGameOver && `KẾT THÚC TRẬN ĐẤU`}
            </div>
            <div style={{ fontSize: '0.8rem', color: isNight ? '#a5b4fc' : isGameOver ? '#a7f3d0' : '#fde047' }}>
              {isNight && 'Trời tối • Hãy thực hiện lượt đi bí mật'}
              {isDayDiscussion && 'Trời sáng • Thảo luận tìm ra kẻ khả nghi'}
              {isDayVoting && 'Bỏ phiếu công khai để xử tử một người'}
              {isGameOver && 'Ván đấu đã ngã ngũ! Xem kết quả bên dưới'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            fontFamily: 'Montserrat, monospace',
          }}>
            {gameState.timerSeconds}s
          </span>
        </div>
      </div>

      {/* ĐIỀU KHIỂN CỦA QUẢN TRÒ (HOST CONTROLS) */}
      {isHost && !isGameOver && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px dashed rgba(56, 189, 248, 0.4)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#7dd3fc', fontWeight: 700 }}>
            👑 Quyền Quản Trò (Host Quick Controls):
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isNight && (
              <button
                onClick={() => roomManager.resolveNightToDay(gameState.roomId)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sun size={13} /> Chuyển Sang Ngày
              </button>
            )}
            {isDayDiscussion && (
              <button
                onClick={() => roomManager.startDayVoting(gameState.roomId)}
                style={{
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Vote size={13} /> Bắt Đầu Bỏ Phiếu
              </button>
            )}
            {isDayVoting && (
              <button
                onClick={() => roomManager.concludeDayVoting(gameState.roomId)}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Moon size={13} /> Chốt Phiếu & Sang Đêm
              </button>
            )}
          </div>
        </div>
      )}

      {/* BANNER KẾT QUẢ KHI GAME OVER */}
      {isGameOver && (
        <div style={{
          background: gameState.winner === 'VILLAGERS' 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 78, 59, 0.4))' 
            : gameState.winner === 'WEREWOLVES' 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(127, 29, 29, 0.4))' 
            : 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(131, 24, 67, 0.4))',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
            {gameState.winner === 'VILLAGERS' && '🎉'}
            {gameState.winner === 'WEREWOLVES' && '🐺'}
            {gameState.winner === 'LOVERS' && '💘'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 6px 0' }}>
            {gameState.winner === 'VILLAGERS' && 'PHE DÂN LÀNG CHIẾN THẮNG!'}
            {gameState.winner === 'WEREWOLVES' && 'PHE MA SÓI CHIẾN THẮNG!'}
            {gameState.winner === 'LOVERS' && 'CẶP ĐÔI TÌNH YÊU CHIẾN THẮNG!'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 16px 0' }}>
            Trận chiến đã kết thúc. Toàn bộ danh tính thực sự của các cư dân đã được lật mở!
          </p>
          <button
            onClick={onLeaveRoom}
            style={{
              background: '#fff',
              color: '#0f172a',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Quay Lại Sảnh Chờ
          </button>
        </div>
      )}

      {/* THẺ VAI TRÒ BÍ MẬT CỦA BẠN */}
      <div style={{
        background: 'rgba(18, 18, 30, 0.95)',
        border: `2px solid ${myRoleDef.color}`,
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: `0 8px 30px ${myRoleDef.color}25`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: myRoleDef.badgeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
            }}>
              {me?.avatar}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                VAI TRÒ CỦA BẠN {!isAlive && <span style={{ color: '#ef4444' }}>(ĐÃ HY SINH)</span>}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: myRoleDef.color }}>
                {myRoleDef.name}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRoleDetails(!showRoleDetails)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
            }}
          >
            {showRoleDetails ? <EyeOff size={14} /> : <Eye size={14} />}
            {showRoleDetails ? 'Ẩn' : 'Kỹ Năng'}
          </button>
        </div>

        {showRoleDetails && (
          <div style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            color: '#e2e8f0',
          }}>
            {myRoleDef.description}
          </div>
        )}

        {/* THÔNG TIN ĐỒNG ĐỘI / NGƯỜI YÊU / SOI TIÊN TRI */}
        {gameState.teamMates.length > 0 && (
          <div style={{
            marginTop: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fca5a5',
          }}>
            <span>🐺</span>
            <span>
              Đồng đội Ma Sói:{' '}
              <strong>
                {gameState.players
                  .filter((p) => gameState.teamMates.includes(p.id))
                  .map((p) => p.name)
                  .join(', ')}
              </strong>
            </span>
          </div>
        )}

        {gameState.couplePartnerId && (
          <div style={{
            marginTop: '12px',
            background: 'rgba(236, 72, 153, 0.15)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fbcfe8',
          }}>
            <Heart size={16} color="#ec4899" fill="#ec4899" />
            <span>
              Người yêu:{' '}
              <strong>{gameState.players.find((p) => p.id === gameState.couplePartnerId)?.name}</strong>
            </span>
          </div>
        )}

        {gameState.seerScanResult && (
          <div style={{
            marginTop: '12px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#7dd3fc',
          }}>
            <span>🔮</span>
            <span>
              Kết quả soi gần nhất:{' '}
              <strong>{gameState.players.find((p) => p.id === gameState.seerScanResult?.targetId)?.name}</strong>{' '}
              là{' '}
              <strong style={{ color: gameState.seerScanResult.isWolf ? '#ef4444' : '#10b981' }}>
                {gameState.seerScanResult.isWolf ? '🐺 MA SÓI' : '👤 NGƯỜI TỐT'}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* KHU VỰC HÀNH ĐỘNG BAN ĐÊM (NIGHT PHASE) */}
      {isNight && isAlive && (
        <div style={{
          background: '#12121e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '16px',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gameState.myRole === 'WEREWOLF' && <><Crosshair size={18} color="#ef4444" /> Chọn Mục Tiêu Để Cắn</>}
            {gameState.myRole === 'SEER' && <><Eye size={18} color="#38bdf8" /> Chọn Người Để Soi Danh Tính</>}
            {gameState.myRole === 'BODYGUARD' && <><Shield size={18} color="#3b82f6" /> Chọn Người Để Bảo Vệ</>}
            {gameState.myRole === 'VILLAGER' && <><Moon size={18} color="#94a3b8" /> Đêm Nay Bạn Chỉ Cần Ngủ Ngoan</>}
          </h3>

          {gameState.myRole === 'VILLAGER' ? (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
              Bạn là Dân Làng. Hãy nhắm mắt chờ trời sáng và theo dõi tình hình thảo luận.
            </p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {livingPlayers.map((p) => {
                  const isSelected = selectedNightTargetId === p.id;
                  const isSelf = p.id === gameState.myPlayerId;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedNightTargetId(p.id)}
                      disabled={nightActionSubmitted}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        color: '#fff',
                        cursor: nightActionSubmitted ? 'not-allowed' : 'pointer',
                        opacity: nightActionSubmitted && !isSelected ? 0.5 : 1,
                      }}
                    >
                      <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{p.avatar}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name} {isSelf && '(Bạn)'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ghế #{p.seatNumber}</div>
                    </button>
                  );
                })}
              </div>

              {!nightActionSubmitted ? (
                <button
                  onClick={handleSubmitNightAction}
                  disabled={!selectedNightTargetId}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: selectedNightTargetId ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: selectedNightTargetId ? '#fff' : '#64748b',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: selectedNightTargetId ? 'pointer' : 'not-allowed',
                  }}
                >
                  Xác Nhận Hành Động
                </button>
              ) : (
                <div style={{
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}>
                  ✓ Đã gửi hành động đêm! Đang đợi chuyển sang Ngày...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* KHU VỰC BỎ PHIẾU TREO CỔ BAN NGÀY (DAY VOTING & LIVE TALLY) */}
      {isDayVoting && (
        <div style={{
          background: '#12121e',
          border: '2px solid rgba(249, 115, 22, 0.4)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '16px',
          boxShadow: '0 8px 30px rgba(249, 115, 22, 0.15)',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c' }}>
            <Vote size={20} /> Tòa Án Bỏ Phiếu Treo Cổ
          </h3>
          
          {gameState.mayorPlayerId === gameState.myPlayerId && isAlive && (
            <div style={{
              background: 'rgba(250, 204, 21, 0.15)',
              border: '1px solid #facc15',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#fef08a',
              fontWeight: 700,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              👑 BẠN LÀ THỊ TRƯỞNG: Lá phiếu của bạn có giá trị GẤP ĐÔI (x2 phiếu)!
            </div>
          )}

          {me?.idiotRevealed && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid #06b6d4',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#67e8f9',
              fontWeight: 700,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              🃏 BẠN LÀ KẺ NGỐC: Đã lật bài tha chết, bạn bị tước quyền bỏ phiếu!
            </div>
          )}

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 14px 0' }}>
            {me?.idiotRevealed
              ? 'Bạn bị tước quyền biểu quyết và chỉ có thể chứng kiến tòa án.'
              : isAlive 
              ? 'Chọn 1 người mà bạn nghi ngờ là Ma Sói để xử tử, hoặc Bỏ Phiếu Trắng:' 
              : 'Bạn đã hy sinh, không thể tham gia bỏ phiếu.'}
          </p>

          {/* Danh sách người chơi để Vote kèm Live Tally */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {livingPlayers.map((p) => {
              const voteCount = gameState.voteTally?.[p.id] || 0;
              const isSelected = selectedVoteTargetId === p.id;
              const isSelf = p.id === gameState.myPlayerId;

              return (
                <button
                  key={p.id}
                  onClick={() => isAlive && handleCastVote(p.id)}
                  disabled={!isAlive}
                  style={{
                    background: isSelected ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '2px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    textAlign: 'center',
                    color: '#fff',
                    position: 'relative',
                    cursor: isAlive ? 'pointer' : 'default',
                  }}
                >
                  {/* Badge số phiếu trực tiếp (Live Tally) */}
                  {voteCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 900,
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.6)',
                    }}>
                      {voteCount} 🗳️
                    </div>
                  )}

                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{p.avatar}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name} {isSelf && '(Bạn)'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ghế #{p.seatNumber}</div>
                </button>
              );
            })}
          </div>

          {/* Nút Bỏ phiếu trắng */}
          {isAlive && (
            <button
              onClick={() => handleCastVote(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: selectedVoteTargetId === null && voteSubmitted ? 'rgba(148, 163, 184, 0.3)' : 'rgba(255,255,255,0.05)',
                border: selectedVoteTargetId === null && voteSubmitted ? '1px solid #94a3b8' : '1px dashed rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🕊️ Bỏ Phiếu Trắng (Không Treo Cổ Ai)
            </button>
          )}

          {voteSubmitted && (
            <div style={{
              marginTop: '10px',
              textAlign: 'center',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}>
              ✓ Bạn đã bỏ phiếu thành công! Có thể chọn lại trước khi hết giờ.
            </div>
          )}
        </div>
      )}

      {/* KHUNG CHAT PHÂN QUYỀN REALTIME (VILLAGE / WOLF / DEAD) */}
      <div style={{
        background: '#12121e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '14px',
        marginBottom: '16px',
      }}>
        {/* Navigation Tabs của Kênh Chat */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '12px' }}>
          {isAlive && (
            <button
              onClick={() => setActiveChatTab('PUBLIC')}
              style={{
                flex: 1,
                background: effectiveChatTab === 'PUBLIC' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: effectiveChatTab === 'PUBLIC' ? '1px solid #38bdf8' : 'none',
                color: effectiveChatTab === 'PUBLIC' ? '#38bdf8' : '#94a3b8',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏘️ Kênh Làng
            </button>
          )}

          {isAlive && isWolfSide && (
            <button
              onClick={() => setActiveChatTab('WOLF')}
              style={{
                flex: 1,
                background: effectiveChatTab === 'WOLF' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                border: effectiveChatTab === 'WOLF' ? '1px solid #ef4444' : 'none',
                color: effectiveChatTab === 'WOLF' ? '#ef4444' : '#94a3b8',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🐺 Hang Sói
            </button>
          )}

          {!isAlive && (
            <button
              onClick={() => setActiveChatTab('DEAD')}
              style={{
                flex: 1,
                background: effectiveChatTab === 'DEAD' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                border: effectiveChatTab === 'DEAD' ? '1px solid #a855f7' : 'none',
                color: effectiveChatTab === 'DEAD' ? '#a855f7' : '#94a3b8',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👻 Cõi Âm
            </button>
          )}
        </div>

        {/* Khung hiển thị tin nhắn */}
        <div style={{
          height: '160px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '6px',
          marginBottom: '10px',
        }}>
          {gameState.chatMessages.filter((m) => m.channel === effectiveChatTab).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: '50px' }}>
              Chưa có tin nhắn nào trong kênh này...
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
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>
                      {m.senderAvatar} {m.senderName}
                    </div>
                    <div style={{
                      background: isMe ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(255,255,255,0.08)',
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '0.85rem',
                      maxWidth: '80%',
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

        {/* Ô nhập tin nhắn & nút Gửi */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                ? 'Đêm tối làng đang ngủ, giữ trật tự...' 
                : effectiveChatTab === 'PUBLIC' && !isAlive
                ? 'Linh hồn không thể chat ở kênh làng...'
                : `Nhập tin nhắn (${effectiveChatTab})...`
            }
            disabled={(effectiveChatTab === 'PUBLIC' && isNight) || (effectiveChatTab === 'PUBLIC' && !isAlive)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={(effectiveChatTab === 'PUBLIC' && isNight) || (effectiveChatTab === 'PUBLIC' && !isAlive)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              borderRadius: '10px',
              padding: '0 16px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* DANH SÁCH TẤT CẢ NGƯỜI CHƠI TRONG PHÒNG */}
      <div style={{
        background: '#12121e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
            <Users size={16} />
            <span>Danh Sách Người Chơi ({gameState.players.length})</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            {livingPlayers.length} còn sống
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gameState.players.map((p) => {
            const isDead = !p.isAlive;
            const revealedRole = gameState.revealedRoles[p.id];
            const isMe = p.id === gameState.myPlayerId;

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: p.isSpeaking 
                    ? 'rgba(34, 197, 94, 0.12)' 
                    : isMe 
                    ? 'rgba(99, 102, 241, 0.1)' 
                    : 'rgba(255,255,255,0.03)',
                  border: p.isSpeaking
                    ? '1px solid #22c55e'
                    : isMe 
                    ? '1px solid rgba(99, 102, 241, 0.4)' 
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  opacity: isDead ? 0.45 : 1,
                  boxShadow: p.isSpeaking ? '0 0 12px rgba(34, 197, 94, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ fontSize: '1.4rem' }}>{p.avatar}</span>
                    {p.isMuted && (
                      <span style={{ position: 'absolute', bottom: '-2px', right: '-4px', background: '#ef4444', borderRadius: '50%', padding: '1px', display: 'flex' }}>
                        <MicOff size={10} color="#fff" />
                      </span>
                    )}
                    {p.isSpeaking && (
                      <span style={{ position: 'absolute', bottom: '-2px', right: '-4px', background: '#22c55e', borderRadius: '50%', padding: '1px', display: 'flex' }}>
                        <Mic size={10} color="#fff" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDead ? '#94a3b8' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>#{p.seatNumber} {p.name} {isMe && '(Bạn)'}</span>
                      {p.isHost && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>👑 Host</span>}
                      {(gameState.mayorPlayerId === p.id || p.isMayor) && (
                        <span style={{
                          background: 'rgba(250, 204, 21, 0.2)',
                          color: '#facc15',
                          border: '1px solid rgba(250, 204, 21, 0.4)',
                          borderRadius: '6px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}>
                          👑 Thị Trưởng (2 phiếu)
                        </span>
                      )}
                      {p.idiotRevealed && (
                        <span style={{
                          background: 'rgba(6, 182, 212, 0.2)',
                          color: '#06b6d4',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          borderRadius: '6px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}>
                          🃏 Kẻ Ngốc (Lật Bài)
                        </span>
                      )}
                      {p.isSpeaking && (
                        <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 800 }}>
                          [Đang Nói 🎙️]
                        </span>
                      )}
                    </div>
                    {isDead ? (
                      <div style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Skull size={12} /> Đã Hy Sinh
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#10b981' }}>
                        {isDayVoting ? (p.hasVoted ? '✓ Đã Bỏ Phiếu' : '⏳ Đang Suy Nghĩ') : 'Sống Sót'}
                      </div>
                    )}
                  </div>
                </div>

                {revealedRole && !p.idiotRevealed && (
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontWeight: 700,
                  }}>
                    {ROLE_DEFINITIONS[revealedRole]?.name || revealedRole}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nhật ký diễn biến ván đấu */}
      <MatchHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        roomId={gameState.roomId}
        historyLog={roomManager.getServerRoom(gameState.roomId)?.historyLog || []}
        winner={gameState.winner}
      />

      {/* Modal xác nhận rời trận đấu */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời Trận Đấu?"
        message="Bạn có chắc chắn muốn rời khỏi trận đấu đang diễn ra? Tiến trình và vai trò của bạn trong ván chơi này sẽ bị hủy bỏ."
        confirmText="Rời Trận"
        cancelText="Ở Lại Tiếp Tục"
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
