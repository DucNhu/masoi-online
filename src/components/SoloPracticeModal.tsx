import React, { useState } from 'react';
import { X, Sword, Target, Sparkles, Shield, Eye, Flame, BookOpen, Play } from 'lucide-react';
import { RoleId } from '../types/game';
import { soundEffects } from '../utils/soundEffects';
import { ROLE_CARD_IMAGES } from '../constants/assets';

interface SoloPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (selectedRole: RoleId, difficulty: 'EASY' | 'HARD') => void;
}

interface PracticeRoleOption {
  role: RoleId;
  name: string;
  icon: string;
  badgeColor: string;
  tip: string;
}

const PRACTICE_ROLES: PracticeRoleOption[] = [
  {
    role: 'HUNTER',
    name: 'Thợ Săn',
    icon: '🏹',
    badgeColor: '#10b981',
    tip: 'Khi bị cắn hoặc bị treo cổ, bạn có quyền găm 1 phát đạn kéo theo kẻ thù xuống mồ.',
  },
  {
    role: 'SEER',
    name: 'Tiên Tri',
    icon: '🔮',
    badgeColor: '#38bdf8',
    tip: 'Mỗi đêm soi danh tính 1 người. Đừng lộ diện quá sớm kẻo bị Sói ám sát!',
  },
  {
    role: 'BODYGUARD',
    name: 'Bảo Vệ',
    icon: '🛡️',
    badgeColor: '#f59e0b',
    tip: 'Mỗi đêm chọn 1 người để bảo vệ an toàn. Không thể bảo vệ 1 người 2 đêm liên tiếp.',
  },
  {
    role: 'WEREWOLF',
    name: 'Ma Sói',
    icon: '🐺',
    badgeColor: '#ef4444',
    tip: 'Cùng bầy sói thống nhất mục tiêu cắn ban đêm, ban ngày ngụy trang hòa nhập vào dân làng.',
  },
  {
    role: 'VILLAGER',
    name: 'Dân Làng',
    icon: '🌾',
    badgeColor: '#a855f7',
    tip: 'Không có quyền năng ban đêm, sức mạnh của bạn là lắng nghe, phản biện và bỏ phiếu chính xác.',
  },
];

export const SoloPracticeModal: React.FC<SoloPracticeModalProps> = ({
  isOpen,
  onClose,
  onStartPractice,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleId>('HUNTER');
  const [difficulty, setDifficulty] = useState<'EASY' | 'HARD'>('HARD');

  if (!isOpen) return null;

  const currentOption = PRACTICE_ROLES.find((r) => r.role === selectedRole) || PRACTICE_ROLES[0];

  const handleStart = () => {
    soundEffects.triggerHaptic('medium');
    soundEffects.playDawnChime();
    onStartPractice(selectedRole, difficulty);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="card-glass"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, rgba(24, 20, 48, 0.98), rgba(12, 10, 24, 0.98))',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: '24px',
          padding: '20px',
          color: '#fff',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <Sword size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Huấn Luyện Thợ Săn Solo
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Tập luyện ngoại tuyến đối đầu với 6 Bot AI thông minh
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Chọn Vai Trò Muốn Luyện */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
            CHỌN VAI TRÒ BẠN MUỐN LUYỆN TẬP:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
            {PRACTICE_ROLES.map((r) => {
              const isSelected = selectedRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    soundEffects.triggerHaptic('light');
                    setSelectedRole(r.role);
                  }}
                  style={{
                    background: isSelected ? `${r.badgeColor}22` : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? `2px solid ${r.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#fff',
                    boxShadow: isSelected ? `0 0 12px ${r.badgeColor}40` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '50px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: `1px solid ${r.badgeColor}80`,
                    flexShrink: 0,
                    background: '#0a0a14',
                  }}>
                    <img 
                      src={ROLE_CARD_IMAGES[r.role]} 
                      alt={r.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? r.badgeColor : '#e2e8f0' }}>
                    {r.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Hướng Dẫn & Gợi Ý Chiến Thuật Của Huấn Luyện Viên */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${currentOption.badgeColor}44`,
            borderRadius: '14px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: currentOption.badgeColor, marginBottom: '4px' }}>
            <BookOpen size={14} /> GỢI Ý CHIẾN THUẬT:
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            {currentOption.tip}
          </div>
        </div>

        {/* 3. Lựa Chọn Độ Khó */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
            ĐỘ KHÓ CỦA BOT AI:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setDifficulty('EASY');
              }}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: difficulty === 'EASY' ? '2px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
                background: difficulty === 'EASY' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: difficulty === 'EASY' ? '#34d399' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🌱 Tập Sự (Dễ)
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.triggerHaptic('light');
                setDifficulty('HARD');
              }}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: difficulty === 'HARD' ? '2px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                background: difficulty === 'HARD' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: difficulty === 'HARD' ? '#f43f5e' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🔥 Lão Luyện (Khó)
            </button>
          </div>
        </div>

        {/* Nút Bắt Đầu Tập Luyện */}
        <button
          type="button"
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #9333ea, #7e22ce)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(147, 51, 234, 0.35)',
            minHeight: '48px',
          }}
        >
          <Play size={18} fill="#fff" />
          <span>VÀO TRẬN TẬP LUYỆN NGAY</span>
        </button>
      </div>
    </div>
  );
};
