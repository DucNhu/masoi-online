import React from 'react';
import { History, Moon, Sun, ArrowLeft } from 'lucide-react';
import { RoundLog } from '../types/game';

interface Props {
  logs: RoundLog[];
  onBack: () => void;
}

export const HistoryLogView: React.FC<Props> = ({ logs, onBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Quay Lại
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800 }}>
          <History size={18} color="var(--accent-gold)" />
          Nhật Ký Ván Đấu ({logs.length})
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Chưa có sự kiện nào được ghi nhận.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.slice().reverse().map(log => {
            const isNight = log.phase === 'NIGHT';
            return (
              <div
                key={log.id}
                className="card-glass"
                style={{
                  padding: '14px',
                  borderLeft: isNight ? '4px solid #6366f1' : '4px solid #f59e0b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isNight ? <Moon size={16} color="#a5b4fc" /> : <Sun size={16} color="#fde047" />}
                    <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                      {log.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {log.time}
                  </span>
                </div>

                <ul style={{
                  paddingLeft: '20px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {log.details.map((item, idx) => (
                    <li key={idx} style={{ lineHeight: 1.4 }}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
