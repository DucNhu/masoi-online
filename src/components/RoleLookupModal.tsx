import React from 'react';
import { X, Shield, Eye, Crosshair, Users, Sparkles, Skull, Heart, VenetianMask, Award, Smile, Flame } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../data/roles';
import { CardMappingConfig } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardMappings: CardMappingConfig;
}

export const RoleLookupModal: React.FC<Props> = ({ isOpen, onClose, cardMappings: _cardMappings }) => {
  if (!isOpen) return null;

  const baseCardList = [
    { rank: 'A', roleId: 'SEER' },
    { rank: 'K', roleId: 'WEREWOLF' },
    { rank: 'Q', roleId: 'WITCH' },
    { rank: 'J', roleId: 'BODYGUARD' },
    { rank: '10', roleId: 'HUNTER' },
    { rank: '2 - 9', roleId: 'VILLAGER' },
  ];

  const expansionCardList = [
    { rank: '9', roleId: 'CUPID' },
    { rank: '8', roleId: 'MINION' },
    { rank: '7', roleId: 'ELDER' },
    { rank: '6', roleId: 'IDIOT' },
    { rank: '5', roleId: 'CURSED' },
  ];

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'WEREWOLF': return <Skull size={20} color="#ef4444" />;
      case 'SEER': return <Eye size={20} color="#38bdf8" />;
      case 'WITCH': return <Sparkles size={20} color="#c084fc" />;
      case 'BODYGUARD': return <Shield size={20} color="#f59e0b" />;
      case 'HUNTER': return <Crosshair size={20} color="#10b981" />;
      case 'CUPID': return <Heart size={20} color="#ec4899" />;
      case 'MINION': return <VenetianMask size={20} color="#f97316" />;
      case 'ELDER': return <Award size={20} color="#eab308" />;
      case 'IDIOT': return <Smile size={20} color="#06b6d4" />;
      case 'CURSED': return <Flame size={20} color="#8b5cf6" />;
      default: return <Users size={20} color="#94a3b8" />;
    }
  };

  const renderCardRow = (rankKey: string, roleId: string) => {
    const roleDef = ROLE_DEFINITIONS[roleId as keyof typeof ROLE_DEFINITIONS] || ROLE_DEFINITIONS.VILLAGER;

    return (
      <div 
        key={`${rankKey}-${roleId}`}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
        }}
      >
        {/* Card Chip */}
        <div style={{
          minWidth: '42px',
          height: '46px',
          background: '#ffffff',
          color: rankKey === 'A' || rankKey === 'K' || rankKey === '9' ? '#dc2626' : '#0f172a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          fontWeight: 900,
          fontSize: rankKey.length > 2 ? '0.8rem' : '1.2rem',
          lineHeight: 1,
        }}>
          <span>{rankKey}</span>
        </div>

        {/* Role Details */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {getRoleIcon(roleId)}
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: roleDef.color }}>
              {roleDef.name}
            </span>
            <span style={{ 
              fontSize: '0.68rem', 
              padding: '2px 8px', 
              borderRadius: '999px',
              background: roleDef.team === 'WEREWOLF' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
              color: roleDef.team === 'WEREWOLF' ? '#f87171' : '#7dd3fc',
              fontWeight: 700,
            }}>
              Phe {roleDef.team === 'WEREWOLF' ? 'Sói' : 'Dân'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {roleDef.description}
          </p>
        </div>
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
    </div>
  );
};
