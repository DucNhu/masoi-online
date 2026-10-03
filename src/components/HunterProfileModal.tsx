import React, { useState } from 'react';
import { ShieldCheck, Award, X, Flame, Lock } from 'lucide-react';
import { getHunterProfile, getRankTier, HunterProfile } from '../utils/eloRating';
import { HUNTER_BADGES } from '../constants/achievements';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const HunterProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [profile] = useState<HunterProfile>(() => getHunterProfile());

  if (!isOpen) return null;

  const currentTier = getRankTier(profile.elo);
  const winRate = profile.matchesPlayed > 0 ? Math.round((profile.matchesWon / profile.matchesPlayed) * 100) : 50;

  return (
    <div className="modal-backdrop">
      <div
        className="card-glass"
        style={{
          width: '92%',
          maxWidth: '460px',
          maxHeight: '88vh',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          boxShadow: '0 0 35px rgba(99, 102, 241, 0.25)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Profile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #312e81)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Award size={20} color="#a5b4fc" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }} className="font-cinzel">
                HỒ SƠ THỢ SĂN
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Huy Hiệu Danh Dự & Chỉ Số Đấu
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon-only"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung Profile */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          {/* Card Thông tin Cấp Bậc */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(17, 24, 39, 0.9))',
              border: `1.5px solid ${currentTier.color}50`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: `0 0 20px ${currentTier.color}20`,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#1e1e2d',
                border: `2px solid ${currentTier.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 8px auto',
              }}
            >
              {profile.avatar}
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              {profile.name}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${currentTier.color}25`, border: `1px solid ${currentTier.color}50`, color: currentTier.color, fontSize: '0.8rem', fontWeight: 800, marginTop: '6px' }}>
              <span>{currentTier.icon}</span>
              <span>{currentTier.name}</span>
              <span>•</span>
              <span style={{ fontFamily: 'monospace' }}>{profile.elo} Elo</span>
            </div>

            {/* Chỉ số 3 cột */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Trận Đấu</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>{profile.matchesPlayed}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tỉ Lệ Thắng</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Flame size={14} color="#34d399" /> {winRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Điểm Uy Tín</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <ShieldCheck size={14} color="#818cf8" /> {profile.reputationScore}
                </div>
              </div>
            </div>
          </div>

          {/* Danh mục Huy Hiệu */}
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#cbd5e1', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🏆 KHO HUY HIỆU DANH DỰ</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {profile.unlockedBadges.length} / {HUNTER_BADGES.length} đã mở
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {HUNTER_BADGES.map((badge) => {
                const isUnlocked = profile.unlockedBadges.includes(badge.id);

                return (
                  <div
                    key={badge.id}
                    style={{
                      background: isUnlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                      border: isUnlocked ? `1px solid ${badge.color}60` : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      opacity: isUnlocked ? 1 : 0.45,
                      filter: isUnlocked ? 'none' : 'grayscale(80%)',
                      boxShadow: isUnlocked ? `0 0 10px ${badge.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                      {badge.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: isUnlocked ? badge.color : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{badge.name}</span>
                        {!isUnlocked && <Lock size={10} color="#64748b" />}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                        {badge.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: '14px', fontSize: '0.85rem' }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
