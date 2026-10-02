import React from 'react';
import { X, Shield, Eye, Crosshair, Users, Sparkles, Skull } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../data/roles';
import { CardMappingConfig } from '../types/game';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardMappings: CardMappingConfig;
}

export const RoleLookupModal: React.FC<Props> = ({ isOpen, onClose, cardMappings }) => {
  if (!isOpen) return null;

  const cardRankList = ['A', 'K', 'Q', 'J', '10', '2-9'];

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'WEREWOLF': return <Skull size={20} color="#ef4444" />;
      case 'SEER': return <Eye size={20} color="#38bdf8" />;
      case 'WITCH': return <Sparkles size={20} color="#c084fc" />;
      case 'BODYGUARD': return <Shield size={20} color="#f59e0b" />;
      case 'HUNTER': return <Crosshair size={20} color="#10b981" />;
      default: return <Users size={20} color="#94a3b8" />;
    }
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
          {cardRankList.map(rankKey => {
            const roleId = rankKey === '2-9' ? 'VILLAGER' : cardMappings[rankKey] || 'VILLAGER';
            const roleDef = ROLE_DEFINITIONS[roleId];

            return (
              <div 
                key={rankKey}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                }}
              >
                {/* Card Chip */}
                <div style={{
                  minWidth: '44px',
                  height: '48px',
                  background: '#ffffff',
                  color: rankKey === 'A' || rankKey === 'K' ? '#dc2626' : '#0f172a',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  fontWeight: 900,
                  fontSize: rankKey === '2-9' ? '0.85rem' : '1.25rem',
                  lineHeight: 1,
                }}>
                  <span>{rankKey}</span>
                </div>

                {/* Role Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {getRoleIcon(roleId)}
                    <span style={{ fontWeight: 700, fontSize: '0.98rem', color: roleDef.color }}>
                      {roleDef.name}
                    </span>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      background: roleDef.team === 'WEREWOLF' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      color: roleDef.team === 'WEREWOLF' ? '#f87171' : '#7dd3fc',
                      fontWeight: 600,
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
          })}
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
