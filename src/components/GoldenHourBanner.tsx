import React, { useState, useEffect } from 'react';
import { getGoldenHourStatus, registerRSVP, GoldenHourStatus, formatCountdown } from '../utils/goldenHours';
import { soundEffects } from '../utils/soundEffects';
import { Flame, Clock, Bell, CheckCircle2, ShieldCheck } from 'lucide-react';

export const GoldenHourBanner: React.FC = () => {
  const [status, setStatus] = useState<GoldenHourStatus>(() => getGoldenHourStatus());
  const [justRSVPed, setJustRSVPed] = useState<boolean>(false);

  // Cập nhật đếm ngược mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getGoldenHourStatus());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRSVP = () => {
    soundEffects.triggerHaptic('medium');
    const res = registerRSVP();
    setStatus(prev => ({
      ...prev,
      rsvpCount: res.newCount,
      hasRSVPed: true,
    }));
    setJustRSVPed(true);
    setTimeout(() => setJustRSVPed(false), 3000);
  };

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        background: status.isOpen
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.2))'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.15))',
        border: status.isOpen
          ? '1px solid rgba(16, 185, 129, 0.35)'
          : '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: status.isOpen
          ? '0 0 20px rgba(16, 185, 129, 0.15)'
          : '0 0 20px rgba(245, 158, 11, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Badge Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {status.isOpen ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: '1px solid rgba(16, 185, 129, 0.4)',
                letterSpacing: '0.5px',
              }}
            >
              <Flame size={12} color="#34d399" />
              CỔNG LÀNG ĐANG MỞ • 100% NGƯỜI THẬT
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: '1px solid rgba(245, 158, 11, 0.35)',
                letterSpacing: '0.5px',
              }}
            >
              <ShieldCheck size={12} color="#fbbf24" />
              CHẾ ĐỘ CHỐNG BOT • ZERO-BOT
            </span>
          )}
        </div>

        {/* Khung đếm ngược */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <Clock size={13} color={status.isOpen ? '#34d399' : '#fbbf24'} />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: status.isOpen ? '#34d399' : '#fde047' }}>
            {formatCountdown(status.secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Main Content Info */}
      {status.isOpen && status.activeSession ? (
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{status.activeSession.icon}</span>
            <span>{status.activeSession.name}</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
            Game tuyệt đối không dùng bot ảo! Tất cả bàn chơi đều là người thật đang trực tuyến. Hãy tham gia ngay để săn sói!
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{status.nextSession.icon}</span>
            <span>Đợt Mở Cổng Kế Tiếp: {status.nextSession.name}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 10px 0', lineHeight: 1.4 }}>
            Để chống bot và tập trung người chơi đông đảo, cổng làng mở theo khung giờ vàng. Bạn vẫn có thể tạo bàn chơi thử nghiệm hoặc báo danh chờ đợt mở cổng.
          </p>

          {/* Action RSVP Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRSVP}
              disabled={status.hasRSVPed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: status.hasRSVPed ? 'default' : 'pointer',
                background: status.hasRSVPed
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'linear-gradient(135deg, #d97706, #b45309)',
                color: status.hasRSVPed ? '#34d399' : '#fff',
                border: status.hasRSVPed
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : 'none',
                transition: 'all 0.2s',
              }}
            >
              {status.hasRSVPed ? (
                <>
                  <CheckCircle2 size={14} color="#34d399" />
                  Đã Báo Danh ({status.rsvpCount} Thợ Săn Sẵn Sàng)
                </>
              ) : (
                <>
                  <Bell size={14} />
                  Báo Danh Săn Sói ({status.rsvpCount} Người Đã Chờ)
                </>
              )}
            </button>

            {justRSVPed && (
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                ✨ Điểm danh thành công!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Decorative Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: status.isOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
