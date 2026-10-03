import React, { useState } from 'react';
import { WEREWOLF_AVATARS, WerewolfAvatar } from '../constants/avatars';
import { NativeBridge } from '../utils/nativeBridge';

interface AvatarPickerModalProps {
  isOpen: boolean;
  selectedAvatarId: string;
  onSelect: (avatar: WerewolfAvatar) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  selectedAvatarId,
  onSelect,
  onClose,
}) => {
  const [currentId, setCurrentId] = useState(selectedAvatarId || 'silver_wolf');

  if (!isOpen) return null;

  const currentAvatar = WEREWOLF_AVATARS.find((a) => a.id === currentId) || WEREWOLF_AVATARS[0];

  const handleSelect = (avatar: WerewolfAvatar) => {
    setCurrentId(avatar.id);
    NativeBridge.hapticImpact('light');
  };

  const handleConfirm = () => {
    NativeBridge.hapticNotification('success');
    onSelect(currentAvatar);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          backgroundColor: '#12121a',
          borderRadius: '20px',
          border: `1px solid ${currentAvatar.auraColor}40`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 24px ${currentAvatar.glow}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f1f5f9', fontWeight: 700 }}>
              Bộ Sưu Tập Avatar Ma Sói
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Chọn diện mạo ma mị của bạn trong ván đấu
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Selected Preview Box */}
        <div
          style={{
            padding: '16px 20px',
            background: `linear-gradient(135deg, rgba(255,255,255,0.02), ${currentAvatar.glow}20)`,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#1e1e2d',
              border: `2px solid ${currentAvatar.auraColor}`,
              boxShadow: `0 0 16px ${currentAvatar.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              flexShrink: 0,
            }}
          >
            {currentAvatar.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: currentAvatar.auraColor, fontSize: '1rem' }}>
                {currentAvatar.name}
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                fontStyle: 'italic',
                lineHeight: 1.35,
              }}
            >
              "{currentAvatar.quote}"
            </p>
          </div>
        </div>

        {/* Avatar Grid */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            maxHeight: '320px',
          }}
        >
          {WEREWOLF_AVATARS.map((avatar) => {
            const isSelected = avatar.id === currentId;
            return (
              <button
                key={avatar.id}
                onClick={() => handleSelect(avatar)}
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? `2px solid ${avatar.auraColor}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 12px ${avatar.glow}` : 'none',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>{avatar.emoji}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: isSelected ? '#f1f5f9' : '#94a3b8',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {avatar.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: currentAvatar.auraColor,
              color: '#0f172a',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${currentAvatar.glow}`,
              transition: 'transform 0.1s ease',
            }}
          >
            Xác Nhận Chọn
          </button>
        </div>
      </div>
    </div>
  );
};
