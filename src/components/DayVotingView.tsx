import React, { useState } from 'react';
import { Vote, Skull, Check, Plus, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';
import { GameState } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  gameState: GameState;
  onExecuteHanging: (hangedPlayerId: string | null) => void;
  privacyShield: boolean;
}

export const DayVotingView: React.FC<Props> = ({
  gameState,
  onExecuteHanging,
  privacyShield,
}) => {
  const { round, players } = gameState;
  const alivePlayers = players.filter(p => p.isAlive);

  // Vote tallies: playerId -> count
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [selectedHangedId, setSelectedHangedId] = useState<string | null>(null);

  const handleAdjustVote = (playerId: string, delta: number) => {
    soundEffects.triggerHaptic('light');
    setVotes(prev => {
      const current = prev[playerId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [playerId]: next };
    });
  };

  // Tìm người có số phiếu cao nhất
  let maxVotePlayerId: string | null = null;
  let maxVoteCount = 0;
  let isTie = false;

  Object.entries(votes).forEach(([id, count]) => {
    if (count > maxVoteCount) {
      maxVoteCount = count;
      maxVotePlayerId = id;
      isTie = false;
    } else if (count === maxVoteCount && count > 0) {
      isTie = true;
    }
  });

  const targetPlayer = players.find(p => p.id === (selectedHangedId || (maxVoteCount > 0 && !isTie ? maxVotePlayerId : null)));

  const handleConfirmHanging = () => {
    if (targetPlayer) {
      soundEffects.triggerHaptic('heavy');
      onExecuteHanging(targetPlayer.id);
    }
  };

  const handleSkipHanging = () => {
    soundEffects.triggerHaptic('medium');
    onExecuteHanging(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div className="card-glass danger-pulse" style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--accent-wolf)',
          fontSize: '0.82rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          <Vote size={18} />
          Bỏ Phiếu Treo Cổ (Ngày {round})
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Ghi nhận số phiếu của làng hoặc chọn trực tiếp người bị đưa lên giàn treo.
        </p>
      </div>

      {/* Players vote grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {alivePlayers.map(p => {
          const voteCount = votes[p.id] || 0;
          const isHighest = maxVoteCount > 0 && maxVotePlayerId === p.id && !isTie;
          const isExplicitlyChosen = selectedHangedId === p.id;
          const roleDef = ROLE_DEFINITIONS[p.roleId];

          return (
            <div
              key={p.id}
              className={`player-row ${isExplicitlyChosen || isHighest ? 'selected' : ''}`}
              style={{
                borderColor: isExplicitlyChosen ? 'var(--accent-wolf)' : isHighest ? 'var(--accent-seer)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: 'var(--accent-gold)',
                }}>
                  {p.seatNumber}
                </span>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {p.name}
                  </div>
                  <div className={privacyShield ? 'privacy-blur' : ''} style={{ fontSize: '0.72rem', color: roleDef.color }}>
                    {roleDef.name} ({p.card.rank}{p.card.suit})
                  </div>
                </div>
              </div>

              {/* Vote Counter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleAdjustVote(p.id, -1)}
                  className="btn btn-ghost"
                  style={{ width: '32px', height: '32px', padding: 0, minHeight: 'auto' }}
                >
                  <Minus size={14} />
                </button>

                <span style={{
                  minWidth: '24px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: voteCount > 0 ? '#f8fafc' : 'var(--text-muted)',
                }}>
                  {voteCount}
                </span>

                <button
                  onClick={() => handleAdjustVote(p.id, 1)}
                  className="btn btn-ghost"
                  style={{ width: '32px', height: '32px', padding: 0, minHeight: 'auto' }}
                >
                  <Plus size={14} />
                </button>

                {/* Direct Select Button */}
                <button
                  onClick={() => setSelectedHangedId(isExplicitlyChosen ? null : p.id)}
                  className={`btn ${isExplicitlyChosen ? 'btn-danger' : 'btn-ghost'}`}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    minHeight: 'auto',
                    marginLeft: '4px',
                  }}
                >
                  {isExplicitlyChosen ? <Check size={14} /> : 'Chọn'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tie warning */}
      {isTie && maxVoteCount > 0 && !selectedHangedId && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '10px 12px',
          color: '#fde047',
          fontSize: '0.8rem',
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>Có sự hòa phiếu ({maxVoteCount} phiếu). Quản trò hãy cho vote lại hoặc chọn bỏ qua lượt treo cổ!</span>
        </div>
      )}

      {/* Target execution box */}
      {targetPlayer && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.15)',
          border: '2px solid var(--accent-wolf)',
          borderRadius: '16px',
          padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 800 }}>
            Người Sắp Bị Treo Cổ:
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f87171', margin: '4px 0' }}>
            {targetPlayer.name} (Ghế {targetPlayer.seatNumber})
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Sau khi xác nhận, người này sẽ bị loại khỏi ván đấu và trăn trối lời cuối.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        position: 'sticky',
        bottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingTop: '8px',
        zIndex: 50,
      }}>
        {targetPlayer ? (
          <button
            onClick={handleConfirmHanging}
            className="btn btn-danger"
            style={{ width: '100%', height: '52px', fontSize: '1.05rem' }}
          >
            <Skull size={20} /> Xác Nhận Treo Cổ {targetPlayer.name}
          </button>
        ) : (
          <button
            onClick={handleSkipHanging}
            className="btn btn-ghost"
            style={{ width: '100%', height: '52px', fontSize: '1rem', border: '1px dashed var(--border-subtle)' }}
          >
            <ShieldCheck size={18} /> Không Treo Cổ Ai (Bỏ Qua & Vào Đêm)
          </button>
        )}
      </div>
    </div>
  );
};
