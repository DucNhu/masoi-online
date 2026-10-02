import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, RotateCcw, Moon, Sun, Globe } from 'lucide-react';
import { GamePhase } from '../types/game';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  round: number;
  phase: GamePhase;
  privacyShield: boolean;
  onTogglePrivacy: () => void;
  onOpenLookup: () => void;
  onResetGame: () => void;
  mode?: 'OFFLINE' | 'ONLINE';
  onToggleMode?: () => void;
}

export const Header: React.FC<Props> = ({
  round,
  phase,
  privacyShield,
  onTogglePrivacy,
  onOpenLookup,
  onResetGame,
  mode = 'OFFLINE',
  onToggleMode,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isNight = phase.startsWith('NIGHT');

  const getPhaseLabel = () => {
    switch (phase) {
      case 'SETUP': return 'Thiết Lập';
      case 'NIGHT_START': return `Đêm ${round}`;
      case 'NIGHT_CUPID': return `Đêm ${round} • Thần Tình Yêu`;
      case 'NIGHT_MINION': return `Đêm ${round} • Kẻ Bán Tơ`;
      case 'NIGHT_BODYGUARD': return `Đêm ${round} • Bảo Vệ`;
      case 'NIGHT_HUNTER': return `Đêm ${round} • Thợ Săn`;
      case 'NIGHT_WEREWOLF': return `Đêm ${round} • Ma Sói`;
      case 'NIGHT_WITCH': return `Đêm ${round} • Phù Thủy`;
      case 'NIGHT_SEER': return `Đêm ${round} • Tiên Tri`;
      case 'DAY_DAWN': return `Ngày ${round} • Bình Minh`;
      case 'DAY_DISCUSSION': return `Ngày ${round} • Thảo Luận`;
      case 'DAY_VOTING': return `Ngày ${round} • Bỏ Phiếu`;
      case 'DAY_EXECUTION': return `Ngày ${round} • Xử Tử`;
      case 'GAME_OVER': return 'Kết Thúc';
      default: return '';
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="top-brand">
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isNight ? 'linear-gradient(135deg, #4338ca, #1e1b4b)' : 'linear-gradient(135deg, #d97706, #78350f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isNight ? '0 0 15px rgba(99, 102, 241, 0.4)' : '0 0 15px rgba(245, 158, 11, 0.4)',
          }}>
            {isNight ? <Moon size={20} color="#a5b4fc" /> : <Sun size={20} color="#fde047" />}
          </div>
          <div>
            <div className="app-title">{mode === 'ONLINE' ? 'MA SÓI ONLINE' : 'MA SÓI OFFLINE'}</div>
            <div className="app-subtitle">
              {mode === 'ONLINE' ? 'PHÒNG CHƠI TRỰC TUYẾN' : (phase === 'SETUP' ? 'TÚ LƠ KHƠ EDITION' : getPhaseLabel())}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode Switcher */}
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="btn btn-ghost btn-icon-only"
              style={{
                borderColor: mode === 'ONLINE' ? '#818cf8' : 'var(--border-subtle)',
                background: mode === 'ONLINE' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              }}
              title={mode === 'ONLINE' ? 'Chuyển sang Chế độ Offline (Quản trò)' : 'Chuyển sang Chế độ Online (Ghép phòng)'}
            >
              <Globe size={18} color={mode === 'ONLINE' ? '#818cf8' : '#94a3b8'} />
            </button>
          )}

          {/* Lookup Modal */}
          <button
            onClick={onOpenLookup}
            className="btn btn-ghost btn-icon-only"
            title="Bảng tra cứu bài Tú"
          >
            <BookOpen size={18} color="#94a3b8" />
          </button>

          {/* Privacy Toggle */}
          <button
            onClick={onTogglePrivacy}
            className="btn btn-ghost btn-icon-only"
            style={{
              borderColor: privacyShield ? 'var(--accent-seer)' : 'var(--border-subtle)',
              background: privacyShield ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            }}
            title={privacyShield ? 'Đang che bài (Bảo mật)' : 'Đang hiện bài'}
          >
            {privacyShield ? <EyeOff size={18} color="#38bdf8" /> : <Eye size={18} color="#94a3b8" />}
          </button>

          {/* Reset Game */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn btn-ghost btn-icon-only"
            title="Làm mới / Ván mới"
          >
            <RotateCcw size={18} color="#94a3b8" />
          </button>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Bắt Đầu Ván Mới?"
        message="Mọi dữ liệu ván đấu hiện tại sẽ được làm mới để chia bài lại từ đầu."
        confirmText="Xác Nhận"
        cancelText="Hủy Bỏ"
        type="danger"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetGame();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
