import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ChallengeItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const CHALLENGE_POOL: ChallengeItem[] = [
  { id: 'MOON', name: 'Mặt Trăng Tròn', icon: '🌕', color: '#fde047' },
  { id: 'WOLF', name: 'Ma Sói Hung Dữ', icon: '🐺', color: '#f87171' },
  { id: 'BOW', name: 'Cung Thợ Săn', icon: '🏹', color: '#60a5fa' },
  { id: 'POTION', name: 'Bình Phù Thủy', icon: '🧪', color: '#a78bfa' },
];

function generateChallenge(): { target: ChallengeItem; pool: ChallengeItem[] } {
  const target = CHALLENGE_POOL[Math.floor(Math.random() * CHALLENGE_POOL.length)];
  const pool = [...CHALLENGE_POOL].sort(() => 0.5 - Math.random());
  return { target, pool };
}

export const HumanVerifyModal: React.FC<Props> = ({ isOpen, onSuccess, onCancel }) => {
  const [{ target: targetItem, pool: shuffledPool }, setChallenge] = useState(generateChallenge);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (item: ChallengeItem) => {
    if (item.id === targetItem.id) {
      soundEffects.triggerHaptic('medium');
      setErrorMsg(null);
      onSuccess();
    } else {
      soundEffects.triggerHaptic('heavy');
      setErrorMsg('Chưa chính xác! Vui lòng chạm đúng biểu tượng yêu cầu.');
      setChallenge(generateChallenge());
    }
  };

  const handleClose = () => {
    setErrorMsg(null);
    setChallenge(generateChallenge());
    onCancel();
  };

  return (
    <div className="modal-backdrop">
      <div
        className="card-glass"
        style={{
          width: '92%',
          maxWidth: '380px',
          padding: '24px',
          textAlign: 'center',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.25)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            border: '1px solid rgba(129, 140, 248, 0.5)',
          }}
        >
          <ShieldCheck size={26} color="#818cf8" />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0' }} className="font-cinzel">
          Xác Minh Người Thật
        </h3>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Để bảo vệ tính công bằng và ngăn chặn script bot auto-click, vui lòng chạm vào biểu tượng:
        </p>

        {/* Khung yêu cầu mục tiêu */}
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            marginBottom: '16px',
            display: 'inline-block',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Mục tiêu: </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: targetItem.color }}>
            {targetItem.icon} {targetItem.name}
          </span>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.75rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            {errorMsg}
          </div>
        )}

        {/* Danh sách 4 lựa chọn */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px' }}>
          {shuffledPool.map(item => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0' }}>{item.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleClose}
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: '0.85rem' }}
        >
          Hủy Bỏ
        </button>
      </div>
    </div>
  );
};
