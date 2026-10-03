import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import { playVoteSound } from '../utils/soundEffects';

export interface EmoteItem {
  id: string;
  emoji: string;
  label: string;
}

export const IN_GAME_EMOTES: EmoteItem[] = [
  { id: 'wolf', emoji: '🐺', label: 'Nghi Sói' },
  { id: 'innocent', emoji: '😇', label: 'Dân Thật' },
  { id: 'shh', emoji: '🤫', label: 'Giữ Im Lặng' },
  { id: 'scream', emoji: '😱', label: 'Cứu Tôi' },
  { id: 'vote', emoji: '⚖️', label: 'Treo Cổ' },
  { id: 'like', emoji: '👍', label: 'Đồng Ý' },
  { id: 'dislike', emoji: '👎', label: 'Phản Đối' },
  { id: 'love', emoji: '💘', label: 'Cặp Đôi' },
  { id: 'fire', emoji: '🔥', label: 'Căng Thẳng' },
];

interface EmotePickerProps {
  onSelectEmote: (emote: EmoteItem) => void;
  disabled?: boolean;
}

export const EmotePicker: React.FC<EmotePickerProps> = ({ onSelectEmote, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (item: EmoteItem) => {
    playVoteSound();
    onSelectEmote(item);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Thả Biểu Cảm Nhanh"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isOpen ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.08)',
          border: isOpen ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.15)',
          color: isOpen ? '#fef08a' : '#cbd5e1',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Smile size={16} color={isOpen ? '#eab308' : '#94a3b8'} />
        <span>Biểu Cảm</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '46px',
            right: 0,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '12px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            width: '260px',
            animation: 'fadeInUp 0.15s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Biểu Cảm Nhanh
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {IN_GAME_EMOTES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
