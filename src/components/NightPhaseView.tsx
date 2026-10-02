import React, { useState } from 'react';
import { Moon, Shield, Eye, Sparkles, Skull, ArrowRight, Check } from 'lucide-react';
import { GameState, NightStepAction } from '../types/game';
import { ROLE_DEFINITIONS, MODERATOR_SCRIPTS } from '../data/roles';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  gameState: GameState;
  onUpdateNightAction: (actions: Partial<NightStepAction>) => void;
  onFinishNight: () => void;
  onSetLovers?: (loverAId: string, loverBId: string) => void;
  privacyShield: boolean;
}

type NightSubStep = 'INTRO' | 'BODYGUARD' | 'WEREWOLF' | 'WITCH' | 'SEER' | 'OUTRO';

export const NightPhaseView: React.FC<Props> = ({
  gameState,
  onUpdateNightAction,
  onFinishNight,
  privacyShield,
}) => {
  const { round, players, currentNightAction, lastProtectedPlayerId, witchPotions } = gameState;

  // Xác định những vai trò nào đang còn sống trong game
  const alivePlayers = players.filter(p => p.isAlive);
  const hasAliveBodyguard = players.some(p => p.roleId === 'BODYGUARD' && p.isAlive);
  const hasAliveWerewolf = players.some(p => ROLE_DEFINITIONS[p.roleId].team === 'WEREWOLF' && p.isAlive);
  const hasAliveWitch = players.some(p => p.roleId === 'WITCH' && p.isAlive);
  const hasAliveSeer = players.some(p => p.roleId === 'SEER' && p.isAlive);

  // Xác định danh sách các bước cần gọi trong đêm này
  const steps: NightSubStep[] = ['INTRO'];
  if (hasAliveBodyguard) steps.push('BODYGUARD');
  if (hasAliveWerewolf) steps.push('WEREWOLF');
  if (hasAliveWitch) steps.push('WITCH');
  if (hasAliveSeer) steps.push('SEER');
  steps.push('OUTRO');

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const currentStep = steps[currentStepIndex];

  // Tiên tri soi
  const [seerInvestigatedId, setSeerInvestigatedId] = useState<string | null>(null);

  // Chuyển sang bước kế tiếp
  const handleNextStep = () => {
    soundEffects.triggerHaptic('light');

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Kết thúc đêm -> Sang Ngày
      soundEffects.playDawnChime();
      onFinishNight();
    }
  };

  // Nạn nhân bị sói cắn (cho Phù Thủy xem)
  const wolfBittenPlayer = players.find(p => p.id === currentNightAction.werewolfTargetId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Night Progress Pill Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '4px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '999px',
        border: '1px solid var(--border-subtle)',
      }}>
        {steps.map((st, idx) => (
          <div
            key={st}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: idx === currentStepIndex 
                ? 'var(--accent-seer)' 
                : idx < currentStepIndex ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Step 1: INTRO */}
      {currentStep === 'INTRO' && (
        <div className="card-glass active-pulse" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3730a3, #1e1b4b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
          }}>
            <Moon size={32} color="#c7d2fe" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }} className="font-cinzel">
            Màn Đêm Thứ {round} Buông Xuống
          </h2>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '14px',
            padding: '14px',
            margin: '16px 0',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800, marginBottom: '4px' }}>
              📢 QUẢN TRÒ HÃY ĐỌC TO:
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: '#f1f5f9', fontStyle: 'italic' }}>
              "{MODERATOR_SCRIPTS.nightSleep}"
            </p>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Đảm bảo tất cả người chơi đã cúi đầu, nhắm mắt và không nhìn trộm.
          </p>
        </div>
      )}

      {/* Step: BODYGUARD (Bảo Vệ - Lá J) */}
      {currentStep === 'BODYGUARD' && (
        <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-guard)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={20} color="var(--accent-guard)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
              Bảo Vệ (Lá J) Thức Dậy
            </h3>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
              📢 LỜI THOẠI QUẢN TRÒ:
            </div>
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', fontStyle: 'italic' }}>
              "{MODERATOR_SCRIPTS.bodyguardWake}"
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Bảo vệ chọn che chở ai đêm nay?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {alivePlayers.map(p => {
              const isSelected = currentNightAction.protectedPlayerId === p.id;
              const isLockedFromLastNight = lastProtectedPlayerId === p.id && round > 1;

              return (
                <button
                  key={p.id}
                  disabled={isLockedFromLastNight}
                  onClick={() => {
                    onUpdateNightAction({
                      protectedPlayerId: isSelected ? null : p.id,
                    });
                  }}
                  className={`btn ${isSelected ? 'btn-gold' : 'btn-ghost'}`}
                  style={{
                    padding: '10px',
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start',
                    opacity: isLockedFromLastNight ? 0.35 : 1,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{p.seatNumber}.</span> {p.name}
                  {isLockedFromLastNight && (
                    <span style={{ fontSize: '0.65rem', marginLeft: 'auto', color: '#fca5a5' }}>(Đêm trước)</span>
                  )}
                  {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: WEREWOLF (Ma Sói - Lá K) */}
      {currentStep === 'WEREWOLF' && (
        <div className="card-glass danger-pulse" style={{ borderLeft: '4px solid var(--accent-wolf)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Skull size={20} color="var(--accent-wolf)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
              Ma Sói (Lá K) Thức Dậy
            </h3>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
              📢 LỜI THOẠI QUẢN TRÒ:
            </div>
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', fontStyle: 'italic' }}>
              "{MODERATOR_SCRIPTS.werewolfWake}"
            </p>
          </div>

          {/* Wolf roster memo */}
          <div className={privacyShield ? 'privacy-blur' : ''} style={{
            fontSize: '0.75rem',
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '6px 10px',
            borderRadius: '6px',
            marginBottom: '10px',
          }}>
            🐺 Danh sách Sói: {players.filter(p => ROLE_DEFINITIONS[p.roleId].team === 'WEREWOLF' && p.isAlive).map(p => `${p.name} (#${p.seatNumber})`).join(', ')}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Đàn sói thống nhất cắn ai đêm nay?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {alivePlayers.map(p => {
              const isSelected = currentNightAction.werewolfTargetId === p.id;
              const isWolf = ROLE_DEFINITIONS[p.roleId].team === 'WEREWOLF';

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onUpdateNightAction({
                      werewolfTargetId: isSelected ? null : p.id,
                    });
                  }}
                  className={`btn ${isSelected ? 'btn-danger' : 'btn-ghost'}`}
                  style={{
                    padding: '10px',
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start',
                    borderColor: isSelected ? 'var(--accent-wolf)' : undefined,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{p.seatNumber}.</span> {p.name}
                  {isWolf && (
                    <span style={{ fontSize: '0.65rem', marginLeft: 'auto', opacity: 0.7 }}>[Sói]</span>
                  )}
                  {isSelected && <Check size={16} style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step: WITCH (Phù Thủy - Lá Q) */}
      {currentStep === 'WITCH' && (
        <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-witch)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={20} color="var(--accent-witch)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
              Phù Thủy (Lá Q) Thức Dậy
            </h3>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
              📢 LỜI THOẠI QUẢN TRÒ:
            </div>
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', fontStyle: 'italic' }}>
              "{MODERATOR_SCRIPTS.witchWake}"
            </p>
          </div>

          {/* Information box: Who got bitten */}
          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: wolfBittenPlayer ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nạn nhân bị cắn đêm nay:</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: wolfBittenPlayer ? '#f87171' : 'var(--text-muted)' }}>
              {wolfBittenPlayer ? `${wolfBittenPlayer.name} (Ghế ${wolfBittenPlayer.seatNumber})` : 'Không có ai bị cắn'}
            </div>
          </div>

          {/* Action 1: Heal Potion */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            marginBottom: '10px',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                💚 Bình Cứu (Hồi sinh)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {witchPotions.hasHealPotion ? 'Còn 1 bình' : 'Đã sử dụng ở hiệp trước'}
              </div>
            </div>

            <button
              disabled={!witchPotions.hasHealPotion || !wolfBittenPlayer}
              onClick={() => onUpdateNightAction({ witchSaved: !currentNightAction.witchSaved })}
              className={`btn ${currentNightAction.witchSaved ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              {currentNightAction.witchSaved ? 'Đã Dùng Cứu' : 'Dùng Cứu'}
            </button>
          </div>

          {/* Action 2: Poison Potion */}
          <div style={{
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#c084fc' }}>
                  ☠️ Bình Độc (Ám sát)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {witchPotions.hasPoisonPotion ? 'Còn 1 bình' : 'Đã sử dụng ở hiệp trước'}
                </div>
              </div>

              {currentNightAction.witchPoisonTargetId && (
                <button
                  onClick={() => onUpdateNightAction({ witchPoisonTargetId: null })}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Hủy chọn
                </button>
              )}
            </div>

            {witchPotions.hasPoisonPotion && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {alivePlayers.map(p => {
                  const isSelected = currentNightAction.witchPoisonTargetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onUpdateNightAction({
                        witchPoisonTargetId: isSelected ? null : p.id,
                      })}
                      className={`btn ${isSelected ? 'btn-danger' : 'btn-ghost'}`}
                      style={{ padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start' }}
                    >
                      {p.seatNumber}. {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: SEER (Tiên Tri - Lá A) */}
      {currentStep === 'SEER' && (
        <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-seer)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Eye size={20} color="var(--accent-seer)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
              Tiên Tri (Lá A) Thức Dậy
            </h3>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800 }}>
              📢 LỜI THOẠI QUẢN TRÒ:
            </div>
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', fontStyle: 'italic' }}>
              "{MODERATOR_SCRIPTS.seerWake}"
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Chọn người Tiên tri muốn soi:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {alivePlayers.map(p => {
              const isSelected = seerInvestigatedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSeerInvestigatedId(p.id)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '10px', fontSize: '0.85rem', justifyContent: 'flex-start' }}
                >
                  <span style={{ fontWeight: 800 }}>{p.seatNumber}.</span> {p.name}
                </button>
              );
            })}
          </div>

          {/* Investigation Outcome Card */}
          {seerInvestigatedId && (() => {
            const target = players.find(p => p.id === seerInvestigatedId);
            if (!target) return null;
            const isWolf = target.roleId === 'WEREWOLF'; // Minion shows as Villager to Seer!

            return (
              <div style={{
                background: isWolf ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                border: `2px solid ${isWolf ? 'var(--accent-wolf)' : 'var(--accent-seer)'}`,
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                boxShadow: isWolf ? 'var(--shadow-blood-glow)' : 'var(--shadow-glow)',
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  KẾT QUẢ CHO QUẢN TRÒ (Ra hiệu kín cho Tiên Tri):
                </div>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: isWolf ? '#f87171' : '#38bdf8',
                  letterSpacing: '0.04em',
                }}>
                  {isWolf ? '🐺 LÀ MA SÓI (Gật đầu) 🐺' : '🕊️ LÀ DÂN / NGƯỜI TỐT (Lắc đầu) 🕊️'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Đối tượng: {target.name} (Lá {target.card.rank}{target.card.suit})
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Step: OUTRO */}
      {currentStep === 'OUTRO' && (
        <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }} className="font-cinzel">
            Mọi Vai Trò Đã Hành Động Xong!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Quản trò hãy sẵn sàng để đánh thức cả làng dậy và công bố diễn biến đêm nay.
          </p>

          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '14px',
            padding: '14px',
            textAlign: 'left',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 800, marginBottom: '6px' }}>
              📋 BẢN TỔNG KẾT BÍ MẬT ĐÊM {round}:
            </div>
            <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Bảo vệ chọn: {players.find(p => p.id === currentNightAction.protectedPlayerId)?.name || 'Không'}</li>
              <li>Sói cắn: {players.find(p => p.id === currentNightAction.werewolfTargetId)?.name || 'Không'}</li>
              <li>Phù thủy cứu: {currentNightAction.witchSaved ? 'CÓ' : 'Không'}</li>
              <li>Phù thủy độc: {players.find(p => p.id === currentNightAction.witchPoisonTargetId)?.name || 'Không'}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Next Step Sticky Button */}
      <div style={{
        position: 'sticky',
        bottom: '80px',
        paddingTop: '8px',
        zIndex: 50,
      }}>
        <button
          onClick={handleNextStep}
          className="btn btn-primary"
          style={{ width: '100%', height: '52px', fontSize: '1.05rem' }}
        >
          {currentStepIndex === steps.length - 1 ? (
            <>☀️ Đánh Thức Cả Làng (Trời Sáng)</>
          ) : (
            <>Vai Trò Tiếp Theo <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};
