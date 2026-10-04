import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Users, Heart } from 'lucide-react';
import { TeamSide, Player } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';
import { ConfirmModal } from './ConfirmModal';
import { PHASE_BACKGROUNDS, ROLE_CARD_IMAGES } from '../constants/assets';

interface Props {
  winner: TeamSide | 'NONE';
  winReason: string;
  players: Player[];
  onNewGame: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  winner,
  winReason,
  players,
  onNewGame,
}) => {
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  useEffect(() => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const getWinnerConfig = () => {
    switch (winner) {
      case 'VILLAGE':
        return {
          title: 'PHE DÂN LÀNG THẮNG!',
          color: '#38bdf8',
          icon: <Users size={40} color="#38bdf8" />,
          bg: `linear-gradient(rgba(10, 18, 30, 0.82), rgba(10, 18, 30, 0.95)), url(${PHASE_BACKGROUNDS.WIN_VILLAGE})`,
          border: '2px solid rgba(56, 189, 248, 0.5)',
        };
      case 'WEREWOLF':
        return {
          title: 'PHE MA SÓI THẮNG!',
          color: '#ef4444',
          icon: <Skull size={40} color="#ef4444" />,
          bg: `linear-gradient(rgba(30, 10, 10, 0.82), rgba(20, 10, 10, 0.95)), url(${PHASE_BACKGROUNDS.WIN_WEREWOLF})`,
          border: '2px solid rgba(239, 68, 68, 0.5)',
        };
      case 'LOVERS':
        return {
          title: 'PHE CẶP ĐÔI THẮNG!',
          color: '#ec4899',
          icon: <Heart size={40} color="#ec4899" />,
          bg: 'linear-gradient(rgba(36, 12, 24, 0.85), rgba(20, 10, 15, 0.95))',
          border: '2px solid rgba(236, 72, 153, 0.5)',
        };
      default:
        return {
          title: 'KẾT THÚC HÒA!',
          color: '#94a3b8',
          icon: <Trophy size={40} color="#94a3b8" />,
          bg: 'linear-gradient(rgba(20, 20, 30, 0.85), rgba(10, 10, 15, 0.95))',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        };
    }
  };

  const config = getWinnerConfig();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 250,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#121422',
        border: config.border,
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Banner */}
        <div style={{
          textAlign: 'center',
          padding: '28px 20px 20px 20px',
          background: config.bg,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            {config.icon}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: config.color, marginBottom: '6px' }} className="font-cinzel">
            {config.title}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
            {winReason}
          </p>
        </div>

        {/* Players Reveal List */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>
            🃏 Danh Tính Thật Của Mọi Người:
          </div>

          {players.map(p => {
            const roleDef = ROLE_DEFINITIONS[p.roleId];
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: p.isAlive ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  opacity: p.isAlive ? 1 : 0.65,
                }}
              >
                {/* Tarot Thumbnail */}
                <div style={{
                  width: '32px',
                  height: '42px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: `1.5px solid ${roleDef.color}`,
                  flexShrink: 0,
                  background: '#0a0a14',
                }}>
                  <img 
                    src={ROLE_CARD_IMAGES[p.roleId]} 
                    alt={roleDef.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                      #{p.seatNumber}
                    </span>
                    <span>{p.name}</span>
                    {!p.isAlive && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>(Đã chết)</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: roleDef.color, fontWeight: 700 }}>
                    {roleDef.name}
                  </div>
                </div>

                <div className="playing-card-badge" style={{ minWidth: '32px', height: '32px', fontSize: '0.88rem' }}>
                  {p.card.rank}{p.card.suit}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setShowConfirmNewGame(true)}
            className="btn btn-primary"
            style={{ width: '100%', height: '50px', fontSize: '1.05rem' }}
          >
            <RotateCcw size={18} /> Bắt Đầu Ván Mới
          </button>
        </div>
      </div>

      {/* Confirm Start New Game Modal */}
      <ConfirmModal
        isOpen={showConfirmNewGame}
        title="Bắt Đầu Ván Mới?"
        message="Mọi kết quả và dữ liệu ván đấu vừa kết thúc sẽ được làm mới để chia bài lại từ đầu."
        confirmText="Ván Mới"
        cancelText="Xem Lại Kết Quả"
        type="warning"
        onConfirm={() => {
          setShowConfirmNewGame(false);
          onNewGame();
        }}
        onCancel={() => setShowConfirmNewGame(false)}
      />
    </div>
  );
};
