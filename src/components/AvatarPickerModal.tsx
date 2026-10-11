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
        className="modal-fixed-shell"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#12121a',
          borderRadius: '20px',
          border: `1px solid ${currentAvatar.auraColor}40`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 24px ${currentAvatar.glow}`,
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
            flexShrink: 0,
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
            padding: '14px 20px',
            background: `linear-gradient(135deg, rgba(255,255,255,0.02), ${currentAvatar.glow}20)`,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#1e1e2d',
              border: `2px solid ${currentAvatar.auraColor}`,
              boxShadow: `0 0 16px ${currentAvatar.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              flexShrink: 0,
            }}
          >
            {currentAvatar.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: currentAvatar.auraColor, fontSize: '0.95rem' }}>
                {currentAvatar.name}
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.78rem',
                color: '#cbd5e1',
                fontStyle: 'italic',
                lineHeight: 1.3,
              }}
            >
              "{currentAvatar.quote}"
            </p>
          </div>
        </div>

        {/* Avatar Grid */}
        <div
          className="modal-scroll-body"
          style={{
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
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
                  padding: '10px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 0 12px ${avatar.glow}` : 'none',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: '1.7rem' }}>{avatar.emoji}</span>
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
          className="modal-pinned-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: '12px',
            marginTop: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '10px',
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
              minHeight: '44px',
              padding: '10px',
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
