import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, Plus, ArrowRight, Volume2 } from 'lucide-react';
import { GameState } from '../types/game';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  gameState: GameState;
  onProceedToVoting: () => void;
  privacyShield: boolean;
}

export const DayDiscussionView: React.FC<Props> = ({
  gameState,
  onProceedToVoting,
}) => {
  const { round, players } = gameState;
  const alivePlayers = players.filter(p => p.isAlive);

  // Timer state
  const [initialSeconds, setInitialSeconds] = useState<number>(90);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            soundEffects.playBell();
            soundEffects.triggerHaptic('heavy');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = (sec?: number) => {
    const target = sec !== undefined ? sec : initialSeconds;
    setIsRunning(false);
    setSecondsLeft(target);
    if (sec !== undefined) setInitialSeconds(sec);
  };

  const handleAdd30s = () => {
    setSecondsLeft(prev => prev + 30);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Discussion Header */}
      <div className="card-glass" style={{ padding: '16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }} className="font-cinzel">
          Thảo Luận Ban Ngày (Ngày {round})
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Còn lại {alivePlayers.length} người sống sót. Cả làng tranh luận và tìm ra kẻ khả nghi!
        </p>
      </div>

      {/* Interactive Timer Card */}
      <div className="card-glass active-pulse" style={{
        textAlign: 'center',
        padding: '24px 16px',
        border: secondsLeft === 0 ? '2px solid var(--accent-wolf)' : '1px solid var(--border-active)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--accent-gold)',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}>
          <Timer size={18} />
          Đồng Hồ Tranh Luận
        </div>

        {/* Big digits */}
        <div style={{
          fontFamily: 'monospace',
          fontSize: '3.6rem',
          fontWeight: 900,
          color: secondsLeft <= 10 && secondsLeft > 0 ? '#f87171' : secondsLeft === 0 ? '#ef4444' : '#f8fafc',
          textShadow: secondsLeft <= 10 ? '0 0 20px rgba(239,68,68,0.5)' : 'none',
          lineHeight: 1,
          margin: '12px 0',
        }}>
          {formatTime(secondsLeft)}
        </div>

        {/* Preset chips */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          {[60, 90, 120, 180].map(s => (
            <button
              key={s}
              onClick={() => handleReset(s)}
              className="btn btn-ghost"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                minHeight: 'auto',
                borderColor: initialSeconds === s ? 'var(--accent-seer)' : 'var(--border-subtle)',
              }}
            >
              {s}s
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handleReset()}
            className="btn btn-ghost btn-icon-only"
            title="Đặt lại giờ"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => {
              soundEffects.triggerHaptic('medium');
              setIsRunning(!isRunning);
            }}
            className={`btn ${isRunning ? 'btn-gold' : 'btn-primary'}`}
            style={{ width: '130px', height: '48px', fontSize: '1rem' }}
          >
            {isRunning ? (
              <><Pause size={18} /> Tạm Dừng</>
            ) : (
              <><Play size={18} fill="white" /> Bắt Đầu</>
            )}
          </button>

          <button
            onClick={handleAdd30s}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> 30s
          </button>

          <button
            onClick={() => soundEffects.playBell()}
            className="btn btn-ghost btn-icon-only"
            title="Thử chuông"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Alive players quick view */}
      <div className="card-glass">
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Danh Sách Người Chơi Còn Sống ({alivePlayers.length}):
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {alivePlayers.map(p => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>
                {p.seatNumber}.
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Button to Voting */}
      <div style={{
        position: 'sticky',
        bottom: '80px',
        paddingTop: '8px',
        zIndex: 50,
      }}>
        <button
          onClick={onProceedToVoting}
          className="btn btn-danger"
          style={{ width: '100%', height: '52px', fontSize: '1.05rem' }}
        >
          Tiến Hành Bỏ Phiếu Treo Cổ <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
