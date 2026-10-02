import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Users, Heart } from 'lucide-react';
import { TeamSide, Player } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';
import { ConfirmModal } from './ConfirmModal';

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
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '2px solid rgba(56, 189, 248, 0.5)',
        };
      case 'WEREWOLF':
        return {
          title: 'PHE MA SÓI THẮNG!',
          color: '#ef4444',
          icon: <Skull size={40} color="#ef4444" />,
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
        };
      case 'LOVERS':
        return {
          title: 'PHE CẶP ĐÔI THẮNG!',
          color: '#ec4899',
          icon: <Heart size={40} color="#ec4899" />,
          bg: 'rgba(236, 72, 153, 0.15)',
          border: '2px solid rgba(236, 72, 153, 0.5)',
        };
      default:
        return {
          title: 'KẾT THÚC HÒA!',
          color: '#94a3b8',
          icon: <Trophy size={40} color="#94a3b8" />,
          bg: 'rgba(255, 255, 255, 0.08)',
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
          padding: '24px 20px 16px 20px',
          background: config.bg,
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
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: p.isAlive ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  opacity: p.isAlive ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                    #{p.seatNumber}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {p.name} {!p.isAlive && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>(Đã chết)</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: roleDef.color }}>
                    {roleDef.name}
                  </span>
                  <div className="playing-card-badge" style={{ minWidth: '32px', height: '32px', fontSize: '0.88rem' }}>
                    {p.card.rank}{p.card.suit}
                  </div>
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
