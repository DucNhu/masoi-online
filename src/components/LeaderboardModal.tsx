import React, { useState } from 'react';
import { Trophy, Medal, X, Users, Flame } from 'lucide-react';
import { getCommunityLeaderboard, LeaderboardEntry } from '../utils/eloRating';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [leaderboard] = useState<LeaderboardEntry[]>(() => getCommunityLeaderboard());

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="card-glass"
        style={{
          width: '92%',
          maxWidth: '480px',
          maxHeight: '85vh',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.2)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
                background: 'linear-gradient(135deg, #d97706, #78350f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Trophy size={20} color="#fde047" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }} className="font-cinzel">
                BẢNG VINH DANH THỢ SĂN
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} color="#10b981" /> 100% Người Thật • Hệ Thống Điểm Elo
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

        {/* Danh sách Leaderboard */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          {leaderboard.map((entry) => {
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;
            const isMe = entry.name.includes('(Bạn)');

            return (
              <div
                key={entry.rank}
                style={{
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(30, 27, 75, 0.6))'
                    : isTop1
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(69, 26, 3, 0.4))'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isMe
                    ? '1.5px solid #818cf8'
                    : isTop1
                    ? '1.5px solid rgba(245, 158, 11, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: isTop1 ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none',
                }}
              >
                {/* Hạng Rank */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    background: isTop1
                      ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                      : isTop2
                      ? 'linear-gradient(135deg, #94a3b8, #475569)'
                      : isTop3
                      ? 'linear-gradient(135deg, #d97706, #92400e)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: isTop1 || isTop2 || isTop3 ? '#fff' : '#94a3b8',
                  }}
                >
                  {isTop1 ? <Medal size={16} /> : `#${entry.rank}`}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#1e1e2d',
                    border: `1.5px solid ${entry.tier.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}
                >
                  {entry.avatar}
                </div>

                {/* Tên & Bậc Rank */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isMe ? '#818cf8' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: entry.tier.color, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <span>{entry.tier.icon}</span>
                    <span>{entry.tier.name}</span>
                  </div>
                </div>

                {/* Điểm Elo & Winrate */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fde047', fontFamily: 'monospace' }}>
                    {entry.elo} <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Elo</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                    <Flame size={11} color="#34d399" />
                    <span>{entry.winRate}% Thắng</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
          ✨ Tham gia các trận đấu trực tuyến trong Khung Giờ Vàng để tích lũy điểm Elo và thăng hạng!
        </div>
      </div>
    </div>
  );
};
