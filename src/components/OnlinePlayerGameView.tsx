import React, { useState } from 'react';
import { ClientGameState } from '../types/multiplayer';
import { ROLE_DEFINITIONS } from '../data/roles';
import { roomManager } from '../logic/roomManager';
import { soundEffects } from '../utils/soundEffects';
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
  LogOut
} from 'lucide-react';

interface Props {
  gameState: ClientGameState;
  onLeaveRoom: () => void;
}

export const OnlinePlayerGameView: React.FC<Props> = ({ gameState, onLeaveRoom }) => {
  const [showRoleDetails, setShowRoleDetails] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState<boolean>(false);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const myRoleDef = ROLE_DEFINITIONS[gameState.myRole] || ROLE_DEFINITIONS.VILLAGER;
  const isNight = gameState.phase === 'NIGHT';

  // Danh sách người chơi còn sống (loại trừ bản thân cho một số hành động)
  const livingPlayers = gameState.players.filter((p) => p.isAlive);

  // Xử lý gửi hành động đêm
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
      setActionSubmitted(true);
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', color: '#fff' }}>
      {/* Header nhỏ hiển thị mã phòng & nút thoát */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>
          PHÒNG: <strong style={{ color: '#38bdf8' }}>{gameState.roomId}</strong> • BẠN: <strong style={{ color: '#fff' }}>{me?.name}</strong>
        </span>
        <button
          onClick={onLeaveRoom}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '4px 10px',
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
      {/* Thanh Trạng Thái Pha & Thời Gian */}
      <div style={{
        background: isNight ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' : 'linear-gradient(135deg, #78350f, #1e293b)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isNight ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isNight ? <Moon size={22} color="#a5b4fc" /> : <Sun size={22} color="#fde047" />}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              {isNight ? `ĐÊM THỨ ${gameState.dayNumber}` : `NGÀY THỨ ${gameState.dayNumber}`}
            </div>
            <div style={{ fontSize: '0.8rem', color: isNight ? '#a5b4fc' : '#fde047' }}>
              {isNight ? 'Trời tối • Hãy thực hiện lượt đi bí mật' : 'Trời sáng • Làng thảo luận và bỏ phiếu'}
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

      {/* THẺ VAI TRÒ BÍ MẬT CỦA BẠN (PRIVATE ROLE CARD) */}
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
                VAI TRÒ BÍ MẬT CỦA BẠN
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
            {showRoleDetails ? 'Ẩn Mô Tả' : 'Xem Kỹ Năng'}
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

        {/* THÔNG TIN NỘI GIÁN ĐẶC BIỆT */}
        {/* 1. Đồng đội Sói */}
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
              Đồng đội Ma Sói của bạn:{' '}
              <strong>
                {gameState.players
                  .filter((p) => gameState.teamMates.includes(p.id))
                  .map((p) => p.name)
                  .join(', ')}
              </strong>
            </span>
          </div>
        )}

        {/* 2. Cặp đôi Cupid */}
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
              Người yêu định mệnh của bạn:{' '}
              <strong>{gameState.players.find((p) => p.id === gameState.couplePartnerId)?.name}</strong>
            </span>
          </div>
        )}

        {/* 3. Kết quả soi của Tiên Tri */}
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

      {/* KHU VỰC HÀNH ĐỘNG TRONG ĐÊM (NIGHT ACTIONS) */}
      {isNight && (
        <div style={{
          background: '#12121e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gameState.myRole === 'WEREWOLF' && <><Crosshair size={18} color="#ef4444" /> Chọn Con Mồi Để Cắn</>}
            {gameState.myRole === 'SEER' && <><Eye size={18} color="#38bdf8" /> Chọn Người Để Soi Danh Tính</>}
            {gameState.myRole === 'BODYGUARD' && <><Shield size={18} color="#3b82f6" /> Chọn Người Để Bảo Vệ</>}
            {gameState.myRole === 'VILLAGER' && <><Moon size={18} color="#94a3b8" /> Ban Đêm Yên Lặng</>}
          </h3>

          {gameState.myRole === 'VILLAGER' ? (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
              Bạn là Dân Làng lương thiện. Hãy nhắm mắt ngủ ngoan và cầu nguyện cho một bình minh yên lành.
            </p>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                Chạm vào một người chơi bên dưới để thi triển kỹ năng của bạn:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                {livingPlayers.map((p) => {
                  const isSelected = selectedTargetId === p.id;
                  const isSelf = p.id === gameState.myPlayerId;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTargetId(p.id)}
                      disabled={actionSubmitted}
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        color: '#fff',
                        cursor: actionSubmitted ? 'not-allowed' : 'pointer',
                        opacity: actionSubmitted && !isSelected ? 0.5 : 1,
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

              {!actionSubmitted ? (
                <button
                  onClick={handleSubmitNightAction}
                  disabled={!selectedTargetId}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: selectedTargetId ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: selectedTargetId ? '#fff' : '#64748b',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: selectedTargetId ? 'pointer' : 'not-allowed',
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
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}>
                  ✓ Bạn đã gửi hành động ban đêm thành công! Đang chờ những người khác...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DANH SÁCH TOÀN BỘ NGƯỜI CHƠI TRONG PHÒNG */}
      <div style={{
        background: '#12121e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
          <Users size={16} />
          <span>Danh Sách Người Chơi ({gameState.players.length})</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gameState.players.map((p) => {
            const isDead = !p.isAlive;
            const revealedRole = gameState.revealedRoles[p.id];

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: p.id === gameState.myPlayerId ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: p.id === gameState.myPlayerId ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  opacity: isDead ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDead ? '#94a3b8' : '#f8fafc' }}>
                      #{p.seatNumber} {p.name} {p.id === gameState.myPlayerId && '(Bạn)'}
                    </div>
                    {isDead && (
                      <div style={{ fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Skull size={12} /> Đã Hy Sinh
                      </div>
                    )}
                  </div>
                </div>

                {revealedRole && (
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
    </div>
  );
};
