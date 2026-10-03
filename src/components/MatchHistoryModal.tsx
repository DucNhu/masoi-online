import React from 'react';
import { Scroll, X, Clock, ShieldCheck, Skull, Trophy } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  historyLog: string[];
  winner: 'VILLAGERS' | 'WEREWOLVES' | 'LOVERS' | null;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  roomId,
  historyLog,
  winner,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    soundEffects.triggerHaptic('light');
    onClose();
  };

  const getWinnerBadge = () => {
    if (!winner) return null;
    if (winner === 'VILLAGERS') {
      return {
        text: 'DÂN LÀNG CHIẾN THẮNG',
        icon: <ShieldCheck size={16} color="#34d399" />,
        bg: 'rgba(16, 185, 129, 0.15)',
        border: '#10b981',
        color: '#6ee7b7',
      };
    }
    if (winner === 'WEREWOLVES') {
      return {
        text: 'MA SÓI CHIẾN THẮNG',
        icon: <Skull size={16} color="#ef4444" />,
        bg: 'rgba(239, 68, 68, 0.15)',
        border: '#ef4444',
        color: '#fca5a5',
      };
    }
    return {
      text: 'CẶP ĐÔI CHIẾN THẮNG',
      icon: <Trophy size={16} color="#ec4899" />,
      bg: 'rgba(236, 72, 153, 0.15)',
      border: '#ec4899',
      color: '#f472b6',
    };
  };

  const winnerBadge = getWinnerBadge();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scroll size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
                Nhật Ký Trận Đấu
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Phòng #{roomId} • Dòng sự kiện thời gian thực
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Winner Announcement if finished */}
        {winnerBadge && (
          <div
            style={{
              margin: '14px 20px 0',
              padding: '10px 14px',
              borderRadius: '12px',
              background: winnerBadge.bg,
              border: `1px solid ${winnerBadge.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: winnerBadge.color,
            }}
          >
            {winnerBadge.icon}
            <span>{winnerBadge.text}</span>
          </div>
        )}

        {/* Timeline Log List */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {historyLog.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 0', fontSize: '0.88rem' }}>
              Chưa có sự kiện nào được ghi lại trong trận đấu này.
            </div>
          ) : (
            historyLog.map((log, index) => {
              const isPhaseHeader = log.includes('===');
              const isWinLog = log.includes('CHIẾN THẮNG');
              const isDeathLog = log.includes('hy sinh') || log.includes('xử tử');

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: isPhaseHeader ? '8px 12px' : '6px 10px',
                    borderRadius: '10px',
                    background: isPhaseHeader
                      ? 'rgba(99, 102, 241, 0.15)'
                      : isWinLog
                      ? 'rgba(234, 179, 8, 0.12)'
                      : isDeathLog
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isPhaseHeader
                      ? '1px solid rgba(99, 102, 241, 0.3)'
                      : isWinLog
                      ? '1px solid rgba(234, 179, 8, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#64748b',
                      minWidth: '24px',
                      paddingTop: '2px',
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: isPhaseHeader ? '0.85rem' : '0.82rem',
                      fontWeight: isPhaseHeader || isWinLog ? 700 : 500,
                      color: isPhaseHeader
                        ? '#c7d2fe'
                        : isWinLog
                        ? '#fef08a'
                        : isDeathLog
                        ? '#fca5a5'
                        : '#e2e8f0',
                      lineHeight: '1.4',
                    }}
                  >
                    {log}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.8)',
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#f8fafc',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
