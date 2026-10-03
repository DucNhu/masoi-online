import React, { useState } from 'react';
import { ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { reportPlayer } from '../utils/eloRating';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerNames: string[];
}

const REPORT_REASONS = [
  'AFK / Thoát bàn giữa chừng',
  'Spam chat / Lời lẽ không văn minh',
  'Cố tình phá game / Tiết lộ vai trò đồng đội',
  'Sử dụng script auto / Treo máy',
];

export const ReportPlayerModal: React.FC<Props> = ({ isOpen, onClose, playerNames }) => {
  const [targetName, setTargetName] = useState<string>(playerNames[0] || '');
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName) return;

    soundEffects.triggerHaptic('medium');
    const result = reportPlayer(targetName, selectedReason);
    setSubmittedMessage(result.message);

    setTimeout(() => {
      setSubmittedMessage(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="card-glass"
        style={{
          width: '92%',
          maxWidth: '420px',
          padding: '20px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <ShieldAlert size={20} color="#f87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fca5a5' }} className="font-cinzel">
                BÁO CÁO VI PHẠM
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Bảo vệ cộng đồng 100% người thật
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-icon-only" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {submittedMessage ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#34d399" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              Báo Cáo Thành Công
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              {submittedMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Người chơi bị báo cáo:
            </label>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1e1e2f',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                marginBottom: '14px',
                boxSizing: 'border-box',
              }}
            >
              {playerNames.length === 0 ? (
                <option value="">(Không có người chơi khác)</option>
              ) : (
                playerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>
              Hành vi vi phạm:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: selectedReason === reason ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: selectedReason === reason ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: selectedReason === reason ? '#fca5a5' : '#cbd5e1',
                  }}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: '0.82rem' }}
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={!targetName}
                style={{
                  flex: 1.5,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444, #991b1b)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: targetName ? 'pointer' : 'not-allowed',
                }}
              >
                Gửi Báo Cáo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
