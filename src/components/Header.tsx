import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, RotateCcw, Moon, Sun, Globe } from 'lucide-react';
import { GamePhase } from '../types/game';
import { ConfirmModal } from './ConfirmModal';

import { BRAND_ASSETS } from '../constants/assets';

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
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: isNight ? '1.5px solid rgba(165, 180, 252, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)',
            boxShadow: isNight ? '0 0 15px rgba(99, 102, 241, 0.4)' : '0 0 15px rgba(245, 158, 11, 0.4)',
            flexShrink: 0,
            background: '#0a0a14',
          }}>
            <img 
              src={BRAND_ASSETS.appIcon} 
              alt="Ma Sói Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <div style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isNight ? '#312e81' : '#78350f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isNight ? <Moon size={9} color="#a5b4fc" /> : <Sun size={9} color="#fde047" />}
            </div>
          </div>
          <div>
            <div className="app-title">{mode === 'ONLINE' ? 'MA SÓI ONLINE' : 'QUẢN TRÒ MA SÓI'}</div>
            <div className="app-subtitle">
              {mode === 'ONLINE' ? 'SẢNH 100% NGƯỜI THẬT' : (phase === 'SETUP' ? 'CHIẾN TRƯỜNG TRĂNG MÁU' : getPhaseLabel())}
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
              title={mode === 'ONLINE' ? 'Chuyển sang Chế độ Quản trò (Trực tiếp)' : 'Chuyển sang Chế độ Online (Sảnh bàn chơi)'}
            >
              <Globe size={18} color={mode === 'ONLINE' ? '#818cf8' : '#94a3b8'} />
            </button>
          )}

          {/* Lookup Modal */}
          <button
            onClick={onOpenLookup}
            className="btn btn-ghost btn-icon-only"
            title="Bí thư các vai trò Ma Sói"
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
