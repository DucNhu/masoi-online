import React, { useState } from 'react';
import {
  Users,
  Shuffle,
  Play,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Layers,
  RotateCcw,
  ClipboardList,
  Edit2,
} from 'lucide-react';
import { Player, CardRank, CardSuit, CardMappingConfig, RoleId } from '../types/game';
import { ROLE_DEFINITIONS } from '../data/roles';
import { soundEffects } from '../utils/soundEffects';

interface Props {
  cardMappings: CardMappingConfig;
  onStartGame: (players: Player[]) => void;
  privacyShield: boolean;
}

interface DraftPlayer {
  id: string;
  seatNumber: number;
  name: string;
  rank: CardRank;
  suit: CardSuit;
  roleId: RoleId;
  isDealt: boolean;
}

const STORAGE_SAVED_NAMES = 'MA_SOI_SAVED_PLAYERS';

const DEFAULT_SAMPLE_NAMES = [
  'Đức', 'Linh', 'Tuấn', 'Hùng', 'Trang', 'Mai', 'Nam', 'Khoa'
];

export const SetupView: React.FC<Props> = ({ cardMappings: _mappings, onStartGame, privacyShield: initialPrivacy }) => {
  // Step: 'PLAYERS' (Nhập tên & cấu hình bài) | 'DEALING' (Phát bài thực tế cho người chơi)
  const [currentStep, setCurrentStep] = useState<'PLAYERS' | 'DEALING'>('PLAYERS');

  // Input thêm tên nhanh
  const [newNameInput, setNewNameInput] = useState('');
  const [showBulkInputModal, setShowBulkInputModal] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');

  // Chế độ xem khi phát bài: 'STEP' (lần lượt từng người) | 'LIST' (toàn bộ danh sách)
  const [dealViewMode, setDealViewMode] = useState<'STEP' | 'LIST'>('STEP');
  const [currentDealingIndex, setCurrentDealingIndex] = useState(0);

  // Bảo mật khi đi phát bài (che vai trò, chỉ hiện lá bài)
  const [privacyMode, setPrivacyMode] = useState(initialPrivacy);

  // Danh sách người chơi
  const [players, setPlayers] = useState<DraftPlayer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_NAMES);
      if (saved) {
        const parsedNames: string[] = JSON.parse(saved);
        if (Array.isArray(parsedNames) && parsedNames.length >= 4) {
          return parsedNames.map((name, idx) => ({
            id: `p-${idx + 1}-${Date.now()}`,
            seatNumber: idx + 1,
            name,
            rank: '2' as CardRank,
            suit: '♠' as CardSuit,
            roleId: 'VILLAGER' as RoleId,
            isDealt: false,
          }));
        }
      }
    } catch (e) {
      console.warn('Could not read saved players', e);
    }

    return DEFAULT_SAMPLE_NAMES.map((name, idx) => ({
      id: `p-${idx + 1}-${Date.now()}`,
      seatNumber: idx + 1,
      name,
      rank: '2' as CardRank,
      suit: '♠' as CardSuit,
      roleId: 'VILLAGER' as RoleId,
      isDealt: false,
    }));
  });

  // Tùy chỉnh số lượng vai trò (KHÔNG CÓ CUPID VÀ KẺ BÁN TƠ)
  const [wolfCount, setWolfCount] = useState<number>(() => {
    const n = players.length;
    if (n <= 6) return 1;
    if (n <= 9) return 2;
    if (n <= 12) return 3;
    return 4;
  });
  const [enableSeer, setEnableSeer] = useState(true);
  const [enableWitch, setEnableWitch] = useState(true);
  const [enableGuard, setEnableGuard] = useState(true);
  const [enableHunter, setEnableHunter] = useState(true);

  const syncRoleDefaults = (newCount: number) => {
    let recWolf = 1;
    if (newCount >= 7 && newCount <= 9) recWolf = 2;
    else if (newCount >= 10 && newCount <= 12) recWolf = 3;
    else if (newCount >= 13) recWolf = 4;
    setWolfCount(recWolf);
    setEnableHunter(newCount >= 7);
    setEnableGuard(newCount >= 6);
  };

  // Lưu tên vào LocalStorage để lần sau dùng lại
  const saveNamesToStorage = (playerList: DraftPlayer[]) => {
    try {
      const names = playerList.map(p => p.name.trim()).filter(Boolean);
      localStorage.setItem(STORAGE_SAVED_NAMES, JSON.stringify(names));
    } catch (e) {
      console.warn('Failed to save players to storage', e);
    }
  };

  // Thêm 1 người chơi
  const handleAddPlayer = (nameToAdd?: string) => {
    const rawName = (nameToAdd !== undefined ? nameToAdd : newNameInput).trim();
    if (players.length >= 20) return;
    const nextSeat = players.length + 1;
    const finalName = rawName || `Người chơi ${nextSeat}`;

    const newP: DraftPlayer = {
      id: `p-${Date.now()}-${nextSeat}`,
      seatNumber: nextSeat,
      name: finalName,
      rank: '2',
      suit: '♠',
      roleId: 'VILLAGER',
      isDealt: false,
    };

    const updated = [...players, newP];
    setPlayers(updated);
    syncRoleDefaults(updated.length);
    setNewNameInput('');
    soundEffects.triggerHaptic('light');
  };

  // Xóa 1 người chơi
  const handleRemovePlayer = (id: string) => {
    if (players.length <= 4) return;
    const filtered = players
      .filter(p => p.id !== id)
      .map((p, index) => ({
        ...p,
        seatNumber: index + 1,
      }));
    setPlayers(filtered);
    syncRoleDefaults(filtered.length);
    soundEffects.triggerHaptic('light');
  };

  // Cập nhật tên người chơi inline
  const handleUpdateName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  // Xử lý nạp hàng loạt tên
  const handleApplyBulkNames = () => {
    const rawList = bulkInputText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (rawList.length >= 4) {
      const newPlayerList: DraftPlayer[] = rawList.slice(0, 20).map((name, idx) => ({
        id: `p-${idx + 1}-${Date.now()}`,
        seatNumber: idx + 1,
        name,
        rank: '2',
        suit: '♠',
        roleId: 'VILLAGER',
        isDealt: false,
      }));
      setPlayers(newPlayerList);
      syncRoleDefaults(newPlayerList.length);
      setShowBulkInputModal(false);
      setBulkInputText('');
      soundEffects.triggerHaptic('medium');
    }
  };

  // Tính toán số Dân Làng
  const specialCount = (enableSeer ? 1 : 0) + (enableWitch ? 1 : 0) + (enableGuard ? 1 : 0) + (enableHunter ? 1 : 0);
  const villagerCount = Math.max(0, players.length - wolfCount - specialCount);
  const totalCardsConfigured = wolfCount + specialCount + villagerCount;

  // Thuật toán: Xào Bài & Chia Ngẫu Nhiên
  const handleShuffleAndDeal = () => {
    soundEffects.triggerHaptic('heavy');
    soundEffects.playShuffle();

    // 1. Tạo bộ bài chuẩn xác theo cấu hình
    interface AssignedCard {
      rank: CardRank;
      suit: CardSuit;
      roleId: RoleId;
    }

    const deck: AssignedCard[] = [];
    const suitsWolf: CardSuit[] = ['♠', '♣', '♦', '♥'];

    // Sói (K)
    for (let i = 0; i < wolfCount; i++) {
      deck.push({
        rank: 'K',
        suit: suitsWolf[i % 4],
        roleId: 'WEREWOLF',
      });
    }

    // Tiên Tri (A)
    if (enableSeer) {
      deck.push({ rank: 'A', suit: '♥', roleId: 'SEER' });
    }

    // Phù Thủy (Q)
    if (enableWitch) {
      deck.push({ rank: 'Q', suit: '♦', roleId: 'WITCH' });
    }

    // Bảo Vệ (J)
    if (enableGuard) {
      deck.push({ rank: 'J', suit: '♠', roleId: 'BODYGUARD' });
    }

    // Thợ Săn (10)
    if (enableHunter) {
      deck.push({ rank: '10', suit: '♥', roleId: 'HUNTER' });
    }

    // Dân Làng (2..9) — cấp các lá bài số thực tế
    const villagerRanks: CardRank[] = ['9', '8', '7', '6', '5', '4', '3', '2'];
    const villagerSuits: CardSuit[] = ['♣', '♦', '♠', '♥'];
    for (let i = 0; i < villagerCount; i++) {
      const vRank = villagerRanks[i % villagerRanks.length];
      const vSuit = villagerSuits[i % villagerSuits.length];
      deck.push({
        rank: vRank,
        suit: vSuit,
        roleId: 'VILLAGER',
      });
    }

    // 2. Fisher-Yates Shuffle
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    // 3. Gán bài đã xào cho từng người chơi
    const assignedPlayers = players.map((p, idx) => {
      const card = shuffled[idx] || { rank: '2' as CardRank, suit: '♠' as CardSuit, roleId: 'VILLAGER' as RoleId };
      return {
        ...p,
        rank: card.rank,
        suit: card.suit,
        roleId: card.roleId,
        isDealt: false,
      };
    });

    setPlayers(assignedPlayers);
    saveNamesToStorage(assignedPlayers);
    setCurrentDealingIndex(0);
    setCurrentStep('DEALING');
  };

  // Đánh dấu 1 người chơi đã nhận bài
  const handleToggleDealt = (id: string) => {
    soundEffects.playCardDeal();
    soundEffects.triggerHaptic('light');
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, isDealt: !p.isDealt } : p));
  };

  // Đánh dấu tất cả người chơi đã nhận bài
  const handleMarkAllDealt = () => {
    soundEffects.playCardDeal();
    soundEffects.triggerHaptic('medium');
    setPlayers(prev => prev.map(p => ({ ...p, isDealt: true })));
  };

  // Bắt đầu game sau khi chia hết bài
  const handleStartFinalGame = () => {
    const finalPlayers: Player[] = players.map(p => ({
      id: p.id,
      seatNumber: p.seatNumber,
      name: p.name.trim() || `Ghế ${p.seatNumber}`,
      card: { rank: p.rank, suit: p.suit },
      roleId: p.roleId,
      isAlive: true,
      isLover: false,
    }));

    saveNamesToStorage(players);
    onStartGame(finalPlayers);
  };

  const dealtCount = players.filter(p => p.isDealt).length;
  const allDealt = dealtCount === players.length && players.length >= 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ======================================================== */}
      {/* BƯỚC 1: NHẬP TÊN NGƯỜI CHƠI & CẤU HÌNH BÀI             */}
      {/* ======================================================== */}
      {currentStep === 'PLAYERS' && (
        <>
          {/* Header Panel */}
          <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }} className="font-cinzel">
                  Danh Sách Người Chơi
                </h2>
              </div>
              <span style={{
                background: 'rgba(251, 191, 36, 0.15)',
                color: 'var(--accent-gold)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 800,
              }}>
                {players.length} Người
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
              Nhập tên thật của từng người chơi. Hệ thống sẽ xào bài ngẫu nhiên và hướng dẫn bạn đưa đúng lá bài Tây cho từng người.
            </p>

            {/* Quick Name Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPlayer();
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder="Nhập tên người chơi mới..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <button
                type="submit"
                disabled={!newNameInput.trim() || players.length >= 20}
                className="btn btn-gold"
                style={{ minWidth: '48px', padding: '0 16px' }}
                title="Thêm người chơi"
              >
                <Plus size={20} />
                <span>Thêm</span>
              </button>
            </form>

            {/* Action helpers */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                onClick={() => setShowBulkInputModal(true)}
                className="btn btn-ghost"
                style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px', height: '40px' }}
              >
                <ClipboardList size={16} />
                Dán Danh Sách Nhanh
              </button>
            </div>
          </div>

          {/* Role Composition Customizer */}
          <div className="card-glass" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={18} color="var(--accent-witch)" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800 }}>Bộ Bài Dự Kiến ({totalCardsConfigured} Lá)</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tú lơ khơ chuẩn
              </span>
            </div>

            {/* Role counters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {/* Sói (K) */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-wolf)' }}>
                    🐺 Ma Sói (K)
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setWolfCount(Math.max(1, wolfCount - 1))}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, minWidth: '16px', textAlign: 'center', color: 'var(--accent-wolf)' }}>
                    {wolfCount}
                  </span>
                  <button
                    onClick={() => setWolfCount(Math.min(5, wolfCount + 1))}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tiên Tri (A) */}
              <button
                onClick={() => setEnableSeer(!enableSeer)}
                style={{
                  background: enableSeer ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: enableSeer ? '1px solid var(--accent-seer)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: enableSeer ? 'var(--accent-seer)' : 'var(--text-muted)' }}>
                  🔮 Tiên Tri (A)
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: enableSeer ? 'var(--accent-seer)' : 'var(--text-muted)' }}>
                  {enableSeer ? '1' : '0'}
                </span>
              </button>

              {/* Phù Thủy (Q) */}
              <button
                onClick={() => setEnableWitch(!enableWitch)}
                style={{
                  background: enableWitch ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: enableWitch ? '1px solid var(--accent-witch)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: enableWitch ? 'var(--accent-witch)' : 'var(--text-muted)' }}>
                  🧪 Phù Thủy (Q)
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: enableWitch ? 'var(--accent-witch)' : 'var(--text-muted)' }}>
                  {enableWitch ? '1' : '0'}
                </span>
              </button>

              {/* Bảo Vệ (J) */}
              <button
                onClick={() => setEnableGuard(!enableGuard)}
                style={{
                  background: enableGuard ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: enableGuard ? '1px solid var(--accent-guard)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: enableGuard ? 'var(--accent-guard)' : 'var(--text-muted)' }}>
                  🛡️ Bảo Vệ (J)
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: enableGuard ? 'var(--accent-guard)' : 'var(--text-muted)' }}>
                  {enableGuard ? '1' : '0'}
                </span>
              </button>

              {/* Thợ Săn (10) */}
              <button
                onClick={() => setEnableHunter(!enableHunter)}
                style={{
                  background: enableHunter ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: enableHunter ? '1px solid var(--accent-hunter)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: enableHunter ? 'var(--accent-hunter)' : 'var(--text-muted)' }}>
                  🏹 Thợ Săn (10)
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: enableHunter ? 'var(--accent-hunter)' : 'var(--text-muted)' }}>
                  {enableHunter ? '1' : '0'}
                </span>
              </button>

              {/* Dân Làng (2..9) */}
              <div style={{
                background: 'rgba(148, 163, 184, 0.1)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
                  👥 Dân Làng (2-9)
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                  {villagerCount}
                </span>
              </div>
            </div>
          </div>

          {/* Roster of Players */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
              Chạm vào tên để chỉnh sửa nhanh:
            </div>

            {players.map((p) => (
              <div
                key={p.id}
                className="player-row"
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  {/* Seat Number */}
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: 'var(--accent-gold)',
                    flexShrink: 0,
                  }}>
                    {p.seatNumber}
                  </span>

                  {/* Player Name Input */}
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => handleUpdateName(p.id, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed rgba(255,255,255,0.2)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      outline: 'none',
                      width: '100%',
                      padding: '4px 0',
                    }}
                    onFocus={(e) => e.target.style.borderBottom = '1px solid var(--accent-gold)'}
                    onBlur={(e) => e.target.style.borderBottom = '1px dashed rgba(255,255,255,0.2)'}
                  />
                </div>

                {/* Delete button */}
                {players.length > 4 && (
                  <button
                    onClick={() => handleRemovePlayer(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xóa người này"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Shuffle & Deal Trigger Button */}
          <div style={{
            position: 'sticky',
            bottom: '80px',
            paddingTop: '8px',
            zIndex: 50,
          }}>
            <button
              onClick={handleShuffleAndDeal}
              disabled={players.length < 4}
              className="btn btn-primary pulse-animation"
              style={{
                width: '100%',
                height: '56px',
                fontSize: '1.08rem',
                fontWeight: 800,
              }}
            >
              <Shuffle size={20} />
              Xào Bài & Chia Ngẫu Nhiên
            </button>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* BƯỚC 2: PHÁT BÀI THỰC TẾ CHO NGƯỜI CHƠI (DEALING PHASE)  */}
      {/* ======================================================== */}
      {currentStep === 'DEALING' && (
        <>
          {/* Dealing Mission Card */}
          <div className="card-glass" style={{ borderLeft: '4px solid var(--accent-seer)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-seer)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
                  Phát Bài Thực Tế
                </h2>
              </div>

              {/* View mode toggle */}
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px' }}>
                <button
                  onClick={() => setDealViewMode('STEP')}
                  style={{
                    border: 'none',
                    background: dealViewMode === 'STEP' ? 'var(--accent-seer)' : 'transparent',
                    color: dealViewMode === 'STEP' ? '#0f172a' : 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Lần Lượt
                </button>
                <button
                  onClick={() => setDealViewMode('LIST')}
                  style={{
                    border: 'none',
                    background: dealViewMode === 'LIST' ? 'var(--accent-seer)' : 'transparent',
                    color: dealViewMode === 'LIST' ? '#0f172a' : 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Danh Sách
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Cầm bộ bài Tây thật trên tay, tìm đúng lá bài ghi bên dưới và <strong>đưa úp</strong> cho từng người chơi.
            </p>

            {/* Dealing Progress Bar */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 700 }}>
                <span style={{ color: allDealt ? '#4ade80' : 'var(--accent-seer)' }}>
                  {allDealt ? '✓ Đã chia xong tất cả bài!' : `Đã phát: ${dealtCount} / ${players.length} người chơi`}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {Math.round((dealtCount / players.length) * 100)}%
                </span>
              </div>
              <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(dealtCount / players.length) * 100}%`,
                  background: allDealt ? '#4ade80' : 'var(--accent-seer)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {/* Privacy Shield & Quick actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className="btn btn-ghost"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '8px 10px',
                  height: '38px',
                  borderColor: privacyMode ? 'var(--accent-seer)' : 'var(--border-subtle)',
                  background: privacyMode ? 'rgba(56, 189, 248, 0.15)' : undefined,
                }}
              >
                {privacyMode ? <EyeOff size={16} color="var(--accent-seer)" /> : <Eye size={16} />}
                <span>{privacyMode ? 'Đang Che Vai Trò (An Toàn)' : 'Ẩn Tên Vai Trò'}</span>
              </button>

              <button
                onClick={handleMarkAllDealt}
                className="btn btn-ghost"
                style={{ fontSize: '0.78rem', padding: '8px 12px', height: '38px' }}
                title="Đánh dấu đã phát tất cả bài"
              >
                <Check size={16} color="#4ade80" />
                <span>Đã Phát Hết</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: STEP-BY-STEP FOCUS (LẦN LƯỢT) */}
          {dealViewMode === 'STEP' && (() => {
            const currentP = players[currentDealingIndex];
            if (!currentP) return null;
            const roleDef = ROLE_DEFINITIONS[currentP.roleId];
            const isRedSuit = currentP.suit === '♦' || currentP.suit === '♥';

            return (
              <div className="card-glass active-pulse" style={{ padding: '24px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Người Chơi {currentDealingIndex + 1} / {players.length}
                </div>

                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px' }} className="font-cinzel">
                  Ghế {currentP.seatNumber}: {currentP.name}
                </h3>

                {/* Big Playing Card Graphic */}
                <div style={{
                  width: '130px',
                  height: '180px',
                  background: 'white',
                  borderRadius: '16px',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                  border: currentP.isDealt ? '4px solid #22c55e' : '4px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  color: isRedSuit ? '#dc2626' : '#0f172a',
                  position: 'relative',
                  userSelect: 'none',
                }}>
                  {/* Top-left rank & suit */}
                  <div style={{ textAlign: 'left', lineHeight: 1 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{currentP.rank}</div>
                    <div style={{ fontSize: '1.1rem' }}>{currentP.suit}</div>
                  </div>

                  {/* Center giant suit */}
                  <div style={{ fontSize: '3rem', textAlign: 'center', opacity: 0.9 }}>
                    {currentP.suit}
                  </div>

                  {/* Bottom-right inverted */}
                  <div style={{ textAlign: 'right', lineHeight: 1 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{currentP.rank}</div>
                    <div style={{ fontSize: '1.1rem' }}>{currentP.suit}</div>
                  </div>
                </div>

                {/* Role Announcement (or hidden in privacy mode) */}
                <div style={{ marginBottom: '16px' }}>
                  {privacyMode ? (
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.06)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                    }}>
                      🔒 Tên vai trò đã được ẩn chống nhìn trộm
                    </div>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 16px',
                      borderRadius: '999px',
                      background: roleDef.badgeBg,
                      border: `1px solid ${roleDef.color}`,
                    }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: roleDef.color }}>
                        {roleDef.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({roleDef.team === 'WEREWOLF' ? 'Phe Sói' : 'Phe Dân'})
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  lineHeight: 1.4,
                  color: '#e2e8f0',
                  marginBottom: '20px',
                }}>
                  👉 Quản trò rút lá <strong>{currentP.rank}{currentP.suit}</strong> trong bộ bài và đưa úp cho <strong>{currentP.name}</strong>.
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    handleToggleDealt(currentP.id);
                    if (!currentP.isDealt && currentDealingIndex < players.length - 1) {
                      setCurrentDealingIndex(currentDealingIndex + 1);
                    }
                  }}
                  className={`btn ${currentP.isDealt ? 'btn-ghost' : 'btn-primary'}`}
                  style={{
                    width: '100%',
                    height: '52px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    borderColor: currentP.isDealt ? '#22c55e' : undefined,
                    color: currentP.isDealt ? '#4ade80' : 'white',
                  }}
                >
                  <Check size={20} />
                  <span>{currentP.isDealt ? `✓ Đã Đưa Bài Cho ${currentP.name}` : `Đã Đưa Lá ${currentP.rank}${currentP.suit} Cho ${currentP.name}`}</span>
                </button>

                {/* Prev / Next Navigation Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button
                    onClick={() => setCurrentDealingIndex(Math.max(0, currentDealingIndex - 1))}
                    disabled={currentDealingIndex === 0}
                    className="btn btn-ghost"
                    style={{ flex: 1, marginRight: '8px', opacity: currentDealingIndex === 0 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={18} />
                    <span>Người Trước</span>
                  </button>
                  <button
                    onClick={() => setCurrentDealingIndex(Math.min(players.length - 1, currentDealingIndex + 1))}
                    disabled={currentDealingIndex === players.length - 1}
                    className="btn btn-ghost"
                    style={{ flex: 1, marginLeft: '8px', opacity: currentDealingIndex === players.length - 1 ? 0.3 : 1 }}
                  >
                    <span>Người Sau</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* VIEW MODE 2: FULL CHECKLIST (DANH SÁCH TOÀN BỘ) */}
          {dealViewMode === 'LIST' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                Chạm vào từng người để đánh dấu đã đưa bài:
              </div>

              {players.map((p) => {
                const roleDef = ROLE_DEFINITIONS[p.roleId];
                const isRedSuit = p.suit === '♦' || p.suit === '♥';

                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleDealt(p.id)}
                    className="player-row"
                    style={{
                      cursor: 'pointer',
                      borderLeft: `4px solid ${p.isDealt ? '#22c55e' : roleDef.color}`,
                      background: p.isDealt ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      transition: 'all 0.2s ease',
                      padding: '12px 14px',
                    }}
                  >
                    {/* Left: Seat & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: p.isDealt ? '#22c55e' : 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: p.isDealt ? '#0f172a' : 'var(--accent-gold)',
                      }}>
                        {p.isDealt ? '✓' : p.seatNumber}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: p.isDealt ? '#4ade80' : 'var(--text-secondary)' }}>
                          {p.isDealt ? 'Đã nhận bài' : 'Chưa nhận bài'}
                        </div>
                      </div>
                    </div>

                    {/* Right: Card Badge & Role */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {!privacyMode && (
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: roleDef.color }}>
                          {roleDef.name}
                        </span>
                      )}

                      <div
                        className="playing-card-badge"
                        style={{
                          color: isRedSuit ? '#dc2626' : '#0f172a',
                          border: p.isDealt ? '2px solid #22c55e' : '1px solid #cbd5e1',
                        }}
                      >
                        <span>{p.rank}</span>
                        <span style={{ fontSize: '0.72rem', position: 'absolute', bottom: '2px', right: '4px' }}>
                          {p.suit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Reshuffle & Edit Back Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleShuffleAndDeal}
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: '0.82rem', padding: '10px' }}
            >
              <RotateCcw size={16} />
              <span>Xào Lại Bài</span>
            </button>
            <button
              onClick={() => setCurrentStep('PLAYERS')}
              className="btn btn-ghost"
              style={{ flex: 1, fontSize: '0.82rem', padding: '10px' }}
            >
              <Edit2 size={16} />
              <span>Sửa Danh Sách</span>
            </button>
          </div>

          {/* Final Start Game Floating Button */}
          <div style={{
            position: 'sticky',
            bottom: '80px',
            paddingTop: '8px',
            zIndex: 50,
          }}>
            <button
              onClick={handleStartFinalGame}
              disabled={!allDealt}
              className={`btn ${allDealt ? 'btn-primary pulse-animation' : 'btn-ghost'}`}
              style={{
                width: '100%',
                height: '56px',
                fontSize: '1.1rem',
                fontWeight: 800,
                opacity: allDealt ? 1 : 0.6,
                cursor: allDealt ? 'pointer' : 'not-allowed',
                boxShadow: allDealt ? '0 0 25px rgba(124, 58, 237, 0.6)' : undefined,
              }}
            >
              <Play size={20} fill={allDealt ? 'white' : 'transparent'} />
              <span>
                {allDealt
                  ? 'Bắt Đầu Ván Đấu (Vào Đêm 1) 🌙'
                  : `Cần Phát Hết Bài (${dealtCount}/${players.length})`}
              </span>
            </button>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* BULK INPUT MODAL DIALOG                                 */}
      {/* ======================================================== */}
      {showBulkInputModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#121526',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '20px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', fontWeight: 800 }} className="font-cinzel">
              Dán Nhanh Danh Sách
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Nhập hoặc dán tên người chơi, phân cách bằng dấu phẩy (,) hoặc xuống dòng:
            </p>

            <textarea
              value={bulkInputText}
              onChange={(e) => setBulkInputText(e.target.value)}
              placeholder="Ví dụ: Đức, Linh, Tuấn, Hùng, Trang, Mai, Nam, Khoa"
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowBulkInputModal(false)}
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Hủy
              </button>
              <button
                onClick={handleApplyBulkNames}
                disabled={!bulkInputText.trim()}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
