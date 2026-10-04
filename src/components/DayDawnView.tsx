import React, { useState } from 'react';
import { Sun, Skull, Crosshair, ArrowRight, ShieldCheck } from 'lucide-react';
import { GameState } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';
import { soundEffects } from '../utils/soundEffects';
import { ConfirmModal } from './ConfirmModal';
import { PHASE_BACKGROUNDS, ROLE_CARD_IMAGES } from '../constants/assets';

interface Props {
  gameState: GameState;
  overnightDeadIds: string[];
  overnightReasons: Record<string, string>;
  hunterPendingId: string | null;
  onHunterShoot: (targetId: string) => void;
  onProceedToDiscussion: () => void;
  privacyShield: boolean;
}

export const DayDawnView: React.FC<Props> = ({
  gameState,
  overnightDeadIds,
  overnightReasons,
  hunterPendingId,
  onHunterShoot,
  onProceedToDiscussion,
  privacyShield,
}) => {
  const { round, players } = gameState;
  const [selectedHunterTargetId, setSelectedHunterTargetId] = useState<string | null>(null);
  const [showHunterConfirm, setShowHunterConfirm] = useState<boolean>(false);

  const deadPlayers = players.filter(p => overnightDeadIds.includes(p.id));
  const hunterPlayer = players.find(p => p.id === hunterPendingId);
  const alivePlayers = players.filter(p => p.isAlive && !overnightDeadIds.includes(p.id));

  const handleConfirmHunter = () => {
    if (selectedHunterTargetId) {
      soundEffects.triggerHaptic('heavy');
      onHunterShoot(selectedHunterTargetId);
      setSelectedHunterTargetId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Dawn Banner */}
      <div className="card-glass" style={{
        textAlign: 'center',
        padding: '28px 18px',
        borderTop: '4px solid var(--accent-gold)',
        backgroundImage: `linear-gradient(rgba(18, 20, 36, 0.82), rgba(10, 12, 22, 0.94)), url(${PHASE_BACKGROUNDS.DAY_DAWN})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '20px',
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #b45309)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px auto',
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)',
        }}>
          <Sun size={32} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }} className="font-cinzel">
          Bình Minh Ngày Thứ {round}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Cả làng cùng thức dậy và lắng nghe thông báo từ Quản trò.
        </p>
      </div>

      {/* Dead players announcement */}
      {deadPlayers.length > 0 ? (
        <div className="card-glass danger-pulse">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            color: 'var(--accent-wolf)',
          }}>
            <Skull size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }} className="font-cinzel">
              Người Thiệt Mạng Đêm Nay ({deadPlayers.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deadPlayers.map(p => {
              const roleDef = ROLE_DEFINITIONS[p.roleId];
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {/* Dead Card Thumbnail */}
                  <div style={{
                    width: '36px',
                    height: '48px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1.5px solid #ef4444',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    flexShrink: 0,
                    background: '#0a0a14',
                    filter: 'grayscale(50%)',
                  }}>
                    <img 
                      src={ROLE_CARD_IMAGES[p.roleId]} 
                      alt={p.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f87171' }}>
                      Ghế {p.seatNumber}: {p.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {overnightReasons[p.id] || 'Bị giết trong đêm'}
                    </div>
                  </div>

                  <div className={privacyShield ? 'privacy-blur' : ''} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: roleDef.color }}>
                      {roleDef.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Lá {p.card.rank}{p.card.suit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <ShieldCheck size={44} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>
            Đêm Qua Bình Yên!
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Không có bất kỳ ai phải ngã xuống trong đêm nay. Toàn thể làng còn nguyên vẹn!
          </p>
        </div>
      )}

      {/* Hunter Death Revenge Trigger */}
      {hunterPlayer && (
        <div className="card-glass active-pulse" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#34d399' }}>
            <Crosshair size={20} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }} className="font-cinzel">
              Kích Hoạt Phát Bắn Của Thợ Săn!
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
            Thợ Săn ({hunterPlayer.name}) đã ngã xuống. Trước khi trút hơi thở cuối cùng, Thợ Săn được quyền chọn bắn chết thêm 1 người!
          </p>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Chọn nạn nhân bị Thợ Săn bắn:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {alivePlayers.map(p => {
              const isSelected = selectedHunterTargetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedHunterTargetId(p.id)}
                  className={`btn ${isSelected ? 'btn-danger' : 'btn-ghost'}`}
                  style={{ padding: '10px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
                >
                  <span style={{ fontWeight: 800 }}>{p.seatNumber}.</span> {p.name}
                </button>
              );
            })}
          </div>

          <button
            disabled={!selectedHunterTargetId}
            onClick={() => setShowHunterConfirm(true)}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            Xác Nhận Bắn Chết
          </button>
        </div>
      )}

      {/* Proceed Button */}
      {!hunterPlayer && (
        <div style={{
          position: 'sticky',
          bottom: '80px',
          paddingTop: '8px',
          zIndex: 50,
        }}>
          <button
            onClick={onProceedToDiscussion}
            className="btn btn-primary"
            style={{ width: '100%', height: '52px', fontSize: '1.05rem' }}
          >
            Bắt Đầu Thảo Luận Ban Ngày <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Modal xác nhận phát đạn thợ săn */}
      {hunterPlayer && (
        <ConfirmModal
          isOpen={showHunterConfirm}
          title="Xác Nhận Bắn Chết?"
          message={`Bạn có chắc chắn muốn xác nhận phát đạn của Thợ Săn (${hunterPlayer.name}) tiêu diệt "${alivePlayers.find(p => p.id === selectedHunterTargetId)?.name}"? Quyết định này không thể hoàn tác.`}
          confirmText="Xác Nhận Bắn"
          cancelText="Chọn Lại"
          variant="danger"
          onConfirm={() => {
            setShowHunterConfirm(false);
            handleConfirmHunter();
          }}
          onCancel={() => setShowHunterConfirm(false)}
        />
      )}
    </div>
  );
};
