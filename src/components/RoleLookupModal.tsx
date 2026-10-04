import React, { useState } from 'react';
import { X, Shield, Eye, Crosshair, Users, Sparkles, Skull, Heart, VenetianMask, Award, Smile, Flame, ZoomIn } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../data/roles';
import { CardMappingConfig, RoleId } from '../types/game';
import { ROLE_CARD_IMAGES, CARD_BACK_IMAGE } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardMappings: CardMappingConfig;
}

export const RoleLookupModal: React.FC<Props> = ({ isOpen, onClose, cardMappings: _cardMappings }) => {
  const [previewRoleId, setPreviewRoleId] = useState<RoleId | null>(null);
  const [showCardBack, setShowCardBack] = useState<boolean>(false);

  if (!isOpen) return null;

  const baseCardList = [
    { rank: 'A', roleId: 'SEER' as RoleId },
    { rank: 'K', roleId: 'WEREWOLF' as RoleId },
    { rank: 'Q', roleId: 'WITCH' as RoleId },
    { rank: 'J', roleId: 'BODYGUARD' as RoleId },
    { rank: '10', roleId: 'HUNTER' as RoleId },
    { rank: '2 - 9', roleId: 'VILLAGER' as RoleId },
  ];

  const expansionCardList = [
    { rank: '9', roleId: 'CUPID' as RoleId },
    { rank: '8', roleId: 'MINION' as RoleId },
    { rank: '7', roleId: 'ELDER' as RoleId },
    { rank: '6', roleId: 'IDIOT' as RoleId },
    { rank: '5', roleId: 'CURSED' as RoleId },
    { rank: '4', roleId: 'MAYOR' as RoleId },
  ];

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'WEREWOLF': return <Skull size={18} color="#ef4444" />;
      case 'SEER': return <Eye size={18} color="#38bdf8" />;
      case 'WITCH': return <Sparkles size={18} color="#c084fc" />;
      case 'BODYGUARD': return <Shield size={18} color="#f59e0b" />;
      case 'HUNTER': return <Crosshair size={18} color="#10b981" />;
      case 'CUPID': return <Heart size={18} color="#ec4899" />;
      case 'MINION': return <VenetianMask size={18} color="#f97316" />;
      case 'ELDER': return <Award size={18} color="#eab308" />;
      case 'IDIOT': return <Smile size={18} color="#06b6d4" />;
      case 'CURSED': return <Flame size={18} color="#8b5cf6" />;
      case 'MAYOR': return <Award size={18} color="#facc15" />;
      default: return <Users size={18} color="#94a3b8" />;
    }
  };

  const renderCardRow = (rankKey: string, roleId: RoleId) => {
    const roleDef = ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.VILLAGER;
    const cardImg = ROLE_CARD_IMAGES[roleId];

    return (
      <div 
        key={`${rankKey}-${roleId}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Tarot Card Thumbnail with Click to Preview */}
        <div 
          onClick={() => {
            setPreviewRoleId(roleId);
            setShowCardBack(false);
          }}
          title="Nhấn để phóng to lá bài"
          style={{
            position: 'relative',
            width: '44px',
            height: '58px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1.5px solid ${roleDef.color}80`,
            boxShadow: `0 4px 12px ${roleDef.color}30`,
            cursor: 'pointer',
            flexShrink: 0,
            background: '#090a12',
          }}
        >
          {cardImg ? (
            <img 
              src={cardImg} 
              alt={roleDef.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#fff',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
            }}>
              {rankKey}
            </div>
          )}
          {/* Rank Badge Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(2px)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 900,
            padding: '1px 4px',
            borderRadius: '4px',
            lineHeight: 1,
            border: `1px solid ${roleDef.color}60`,
          }}>
            {rankKey}
          </div>
        </div>

        {/* Role Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            {getRoleIcon(roleId)}
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: roleDef.color }}>
              {roleDef.name}
            </span>
            <span style={{ 
              fontSize: '0.65rem', 
              padding: '2px 8px', 
              borderRadius: '999px',
              background: roleDef.team === 'WEREWOLF' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              color: roleDef.team === 'WEREWOLF' ? '#f87171' : '#7dd3fc',
              fontWeight: 700,
            }}>
              Phe {roleDef.team === 'WEREWOLF' ? 'Sói' : 'Dân'}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
            {roleDef.description}
          </p>
        </div>

        {/* View Full Card Button */}
        <button
          onClick={() => {
            setPreviewRoleId(roleId);
            setShowCardBack(false);
          }}
          className="btn btn-ghost btn-icon-only"
          style={{ width: '32px', height: '32px', flexShrink: 0, padding: 0 }}
          title="Xem lá bài chi tiết"
        >
          <ZoomIn size={16} color="var(--text-secondary)" />
        </button>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#121526',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
              🃏 Bảng Quy Ước Bài Tú
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Quy ước lá bài tây tương ứng vai trò Ma Sói
            </p>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-icon-only"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: '16px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Nhóm 1: Cơ bản */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: 'var(--accent-gold)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '2px',
          }}>
            🌟 Bộ Vai Trò Cơ Bản (Mặc định)
          </div>
          {baseCardList.map(item => renderCardRow(item.rank, item.roleId))}

          {/* Nhóm 2: Mở rộng */}
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#c084fc',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '2px',
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
          }}>
            ✨ Gói Mở Rộng (Khi Bật Mở Rộng)
          </div>
          {expansionCardList.map(item => renderCardRow(item.rank, item.roleId))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button 
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Đã Hiểu, Quay Lại
          </button>
        </div>
      </div>

      {/* POPUP XEM TOÀN BỘ LÁ BÀI TAROT NGHỆ THUẬT */}
      {previewRoleId && (() => {
        const pDef = ROLE_DEFINITIONS[previewRoleId];
        const pImg = ROLE_CARD_IMAGES[previewRoleId];
        const rankStr = Array.isArray(pDef.defaultRank) ? pDef.defaultRank.join(', ') : pDef.defaultRank;

        return (
          <div 
            onClick={() => setPreviewRoleId(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(5, 5, 12, 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '340px',
                background: '#101322',
                borderRadius: '24px',
                border: `2px solid ${pDef.color}`,
                boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 30px ${pDef.color}40`,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Nút đóng */}
              <button
                onClick={() => setPreviewRoleId(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={18} />
              </button>

              {/* Lá bài Tarot lớn có thể lật */}
              <div 
                onClick={() => setShowCardBack(!showCardBack)}
                title="Nhấn để lật mặt sau lá bài"
                style={{
                  width: '210px',
                  height: '280px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `2px solid ${pDef.color}`,
                  boxShadow: `0 8px 30px rgba(0,0,0,0.8), 0 0 20px ${pDef.color}50`,
                  marginBottom: '14px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: '#0a0a14',
                  transition: 'transform 0.2s ease',
                }}
              >
                <img 
                  src={showCardBack ? CARD_BACK_IMAGE : pImg} 
                  alt={pDef.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {!showCardBack && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    color: pDef.color,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    border: `1px solid ${pDef.color}80`,
                  }}>
                    Lá {rankStr}
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: 0,
                  right: 0,
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}>
                  {showCardBack ? '🔄 Chạm để xem mặt trước' : '🔄 Chạm để lật mặt sau'}
                </div>
              </div>

              {/* Thông tin vai trò */}
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: pDef.color, margin: '0 0 4px 0' }}>
                {pDef.name} ({pDef.nameEn})
              </h3>
              <div style={{
                display: 'inline-block',
                background: pDef.badgeBg,
                color: pDef.color,
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '20px',
                marginBottom: '10px',
                border: `1px solid ${pDef.color}40`,
              }}>
                {pDef.team === 'WEREWOLF' ? '🐺 PHE MA SÓI' : pDef.team === 'VILLAGE' ? '👤 PHE DÂN LÀNG' : '✨ PHE THỨ BA'}
              </div>

              <p style={{
                fontSize: '0.82rem',
                color: '#cbd5e1',
                lineHeight: 1.45,
                margin: '0 0 16px 0',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
              }}>
                {pDef.description}
              </p>

              <button
                onClick={() => setPreviewRoleId(null)}
                className="btn btn-primary"
                style={{ width: '100%', background: pDef.color, color: '#090a12', fontWeight: 800 }}
              >
                Đóng Xem Bài
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
