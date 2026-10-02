import React, { useState, useEffect } from 'react';
import { GameState, Player, NightStepAction, TeamSide } from './types/game';
import { DEFAULT_CARD_MAPPINGS, ROLE_DEFINITIONS } from './data/roles';
import {
  saveGameStateToStorage,
  loadGameStateFromStorage,
  clearGameStateStorage,
  resolveNightActions,
  evaluateWinCondition,
  createRoundLog,
} from './logic/gameEngine';
import { Header } from './components/Header';
import { RoleLookupModal } from './components/RoleLookupModal';
import { SetupView } from './components/SetupView';
import { NightPhaseView } from './components/NightPhaseView';
import { DayDawnView } from './components/DayDawnView';
import { DayDiscussionView } from './components/DayDiscussionView';
import { DayVotingView } from './components/DayVotingView';
import { GameOverModal } from './components/GameOverModal';
import { HistoryLogView } from './components/HistoryLogView';
import { soundEffects } from './utils/soundEffects';
import { Gamepad2, Users, History, BookOpen, Heart } from 'lucide-react';

const INITIAL_STATE: GameState = {
  round: 1,
  phase: 'SETUP',
  players: [],
  cardMappings: DEFAULT_CARD_MAPPINGS,
  witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
  lastProtectedPlayerId: null,
  currentNightAction: {
    protectedPlayerId: null,
    werewolfTargetId: null,
    witchSaved: false,
    witchPoisonTargetId: null,
    seerTargetId: null,
  },
  cupidPaired: false,
  lovers: null,
  historyLogs: [],
  winner: null,
  winReason: null,
  hunterPendingRevenge: false,
  hunterPendingPlayerId: null,
  privacyShield: false,
};

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameStateFromStorage();
    return saved || INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'GAME' | 'PLAYERS' | 'LOGS' | 'CARDS'>('GAME');
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);

  // Lưu lại người chết qua đêm để DayDawnView hiển thị
  const [overnightDeadIds, setOvernightDeadIds] = useState<string[]>([]);
  const [overnightReasons, setOvernightReasons] = useState<Record<string, string>>({});
  const [hunterPendingId, setHunterPendingId] = useState<string | null>(null);

  // Tự động sync vào LocalStorage mỗi khi gameState thay đổi
  useEffect(() => {
    saveGameStateToStorage(gameState);
  }, [gameState]);

  // Handler: Bắt đầu game từ màn hình Setup
  const handleStartGame = (configuredPlayers: Player[]) => {
    soundEffects.triggerHaptic('heavy');
    soundEffects.playNightAmbiance();

    const initialLog = createRoundLog(
      1,
      'NIGHT',
      'Khởi Tranh Ván Đấu',
      [`Ván đấu bắt đầu với ${configuredPlayers.length} người chơi. Đêm thứ nhất buông xuống.`]
    );

    setGameState(prev => ({
      ...prev,
      round: 1,
      phase: 'NIGHT_START',
      players: configuredPlayers,
      historyLogs: [initialLog],
    }));
    setActiveTab('GAME');
  };

  // Handler: Cập nhật hành động trong đêm
  const handleUpdateNightAction = (updates: Partial<NightStepAction>) => {
    setGameState(prev => ({
      ...prev,
      currentNightAction: {
        ...prev.currentNightAction,
        ...updates,
      },
    }));
  };

  // Handler: Gán cặp đôi từ Cupid
  const handleSetLovers = (loverAId: string, loverBId: string) => {
    setGameState(prev => ({
      ...prev,
      lovers: [loverAId, loverBId],
      cupidPaired: true,
      players: prev.players.map(p => ({
        ...p,
        isLover: p.id === loverAId || p.id === loverBId,
        loverWithId: p.id === loverAId ? loverBId : p.id === loverBId ? loverAId : undefined,
      })),
    }));
  };

  // Handler: Kết thúc các bước đêm -> Giải quyết thương vong & Sang Bình Minh
  const handleFinishNight = () => {
    const resolution = resolveNightActions(gameState);

    // Cập nhật trạng thái người chết
    let updatedPlayers = gameState.players.map(p => {
      if (resolution.deadPlayerIds.includes(p.id)) {
        return {
          ...p,
          isAlive: false,
          deathReason: resolution.deathReasons[p.id] || 'Bị sát hại trong đêm',
          deathRound: gameState.round,
        };
      }
      return p;
    });

    // Cập nhật kho thuốc của Phù thủy
    const updatedPotions = { ...gameState.witchPotions };
    if (gameState.currentNightAction.witchSaved) updatedPotions.hasHealPotion = false;
    if (gameState.currentNightAction.witchPoisonTargetId) updatedPotions.hasPoisonPotion = false;

    // Ghi log đêm
    const nightLog = createRoundLog(
      gameState.round,
      'NIGHT',
      `Kết Quả Đêm ${gameState.round}`,
      resolution.summaryLogs
    );

    setOvernightDeadIds(resolution.deadPlayerIds);
    setOvernightReasons(resolution.deathReasons);
    setHunterPendingId(resolution.hunterTriggeredId);

    // Kiểm tra Thắng Thua
    const winCheck = evaluateWinCondition(updatedPlayers, gameState.lovers);

    if (winCheck.isOver) {
      setGameState(prev => ({
        ...prev,
        phase: 'GAME_OVER',
        players: updatedPlayers,
        witchPotions: updatedPotions,
        lastProtectedPlayerId: prev.currentNightAction.protectedPlayerId,
        historyLogs: [...prev.historyLogs, nightLog],
        winner: winCheck.winner as TeamSide,
        winReason: winCheck.reason,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        phase: 'DAY_DAWN',
        players: updatedPlayers,
        witchPotions: updatedPotions,
        lastProtectedPlayerId: prev.currentNightAction.protectedPlayerId,
        historyLogs: [...prev.historyLogs, nightLog],
      }));
    }
  };

  // Handler: Thợ săn bắn phát súng cuối cùng khi chết ở bình minh
  const handleHunterShoot = (targetId: string) => {
    const target = gameState.players.find(p => p.id === targetId);
    if (!target) return;

    const deadIdsToAdd = [targetId];
    const reasonsToAdd: Record<string, string> = {
      [targetId]: 'Bị Thợ Săn bắn phát súng cuối cùng',
    };

    // Kiểm tra nếu mục tiêu thợ săn bắn là người trong cặp đôi
    if (gameState.lovers) {
      const [lA, lB] = gameState.lovers;
      if (targetId === lA && !deadIdsToAdd.includes(lB)) {
        deadIdsToAdd.push(lB);
        reasonsToAdd[lB] = 'Tuẫn tiết chết theo người yêu bị thợ săn bắn';
      } else if (targetId === lB && !deadIdsToAdd.includes(lA)) {
        deadIdsToAdd.push(lA);
        reasonsToAdd[lA] = 'Tuẫn tiết chết theo người yêu bị thợ săn bắn';
      }
    }

    const updatedPlayers = gameState.players.map(p => {
      if (deadIdsToAdd.includes(p.id)) {
        return {
          ...p,
          isAlive: false,
          deathReason: reasonsToAdd[p.id],
          deathRound: gameState.round,
        };
      }
      return p;
    });

    const hunterLog = createRoundLog(
      gameState.round,
      'DAY',
      `Phát Bắn Báo Thù Của Thợ Săn`,
      [`🏹 Thợ Săn đã bắn gục ${target.name} (Ghế ${target.seatNumber})!`]
    );

    setOvernightDeadIds(prev => [...prev, ...deadIdsToAdd]);
    setOvernightReasons(prev => ({ ...prev, ...reasonsToAdd }));
    setHunterPendingId(null);

    const winCheck = evaluateWinCondition(updatedPlayers, gameState.lovers);
    if (winCheck.isOver) {
      setGameState(prev => ({
        ...prev,
        phase: 'GAME_OVER',
        players: updatedPlayers,
        winner: winCheck.winner as TeamSide,
        winReason: winCheck.reason,
        historyLogs: [...prev.historyLogs, hunterLog],
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        historyLogs: [...prev.historyLogs, hunterLog],
      }));
    }
  };

  // Handler: Bắt đầu Thảo luận ban ngày
  const handleProceedToDiscussion = () => {
    soundEffects.triggerHaptic('light');
    setGameState(prev => ({
      ...prev,
      phase: 'DAY_DISCUSSION',
    }));
  };

  // Handler: Chuyển sang Bỏ phiếu treo cổ
  const handleProceedToVoting = () => {
    soundEffects.triggerHaptic('medium');
    setGameState(prev => ({
      ...prev,
      phase: 'DAY_VOTING',
    }));
  };

  // Handler: Xử tử treo cổ
  const handleExecuteHanging = (hangedPlayerId: string | null) => {
    if (!hangedPlayerId) {
      // Bỏ qua lượt treo cổ -> Chuyển sang Đêm kế tiếp
      const skipLog = createRoundLog(
        gameState.round,
        'DAY',
        `Biểu Quyết Ngày ${gameState.round}`,
        ['Làng quyết định không treo cổ ai trong ngày hôm nay.']
      );

      setGameState(prev => ({
        ...prev,
        round: prev.round + 1,
        phase: 'NIGHT_START',
        currentNightAction: {
          protectedPlayerId: null,
          werewolfTargetId: null,
          witchSaved: false,
          witchPoisonTargetId: null,
          seerTargetId: null,
        },
        historyLogs: [...prev.historyLogs, skipLog],
      }));
      soundEffects.playNightAmbiance();
      return;
    }

    const victim = gameState.players.find(p => p.id === hangedPlayerId);
    if (!victim) return;

    const deadIds = [hangedPlayerId];
    const logDetails = [`⚖️ ${victim.name} (Ghế ${victim.seatNumber}) đã bị dân làng treo cổ.`];

    // Cặp đôi chết theo
    if (gameState.lovers) {
      const [lA, lB] = gameState.lovers;
      if (hangedPlayerId === lA) {
        deadIds.push(lB);
        const partner = gameState.players.find(p => p.id === lB);
        logDetails.push(`💔 ${partner?.name || 'Người yêu'} tuẫn tiết chết theo người yêu.`);
      } else if (hangedPlayerId === lB) {
        deadIds.push(lA);
        const partner = gameState.players.find(p => p.id === lA);
        logDetails.push(`💔 ${partner?.name || 'Người yêu'} tuẫn tiết chết theo người yêu.`);
      }
    }

    const updatedPlayers = gameState.players.map(p => {
      if (deadIds.includes(p.id)) {
        return {
          ...p,
          isAlive: false,
          deathReason: p.id === hangedPlayerId ? 'Bị dân làng treo cổ' : 'Tuẫn tiết chết theo người yêu',
          deathRound: gameState.round,
        };
      }
      return p;
    });

    const voteLog = createRoundLog(
      gameState.round,
      'DAY',
      `Treo Cổ Ngày ${gameState.round}`,
      logDetails
    );

    const winCheck = evaluateWinCondition(updatedPlayers, gameState.lovers);
    if (winCheck.isOver) {
      setGameState(prev => ({
        ...prev,
        phase: 'GAME_OVER',
        players: updatedPlayers,
        winner: winCheck.winner as TeamSide,
        winReason: winCheck.reason,
        historyLogs: [...prev.historyLogs, voteLog],
      }));
    } else {
      // Chuyển sang Đêm kế tiếp
      soundEffects.playNightAmbiance();
      setGameState(prev => ({
        ...prev,
        round: prev.round + 1,
        phase: 'NIGHT_START',
        players: updatedPlayers,
        currentNightAction: {
          protectedPlayerId: null,
          werewolfTargetId: null,
          witchSaved: false,
          witchPoisonTargetId: null,
          seerTargetId: null,
        },
        historyLogs: [...prev.historyLogs, voteLog],
      }));
    }
  };

  // Handler: Reset toàn bộ game ván mới
  const handleResetGame = () => {
    clearGameStateStorage();
    setGameState(INITIAL_STATE);
    setOvernightDeadIds([]);
    setOvernightReasons({});
    setHunterPendingId(null);
    setActiveTab('GAME');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        round={gameState.round}
        phase={gameState.phase}
        privacyShield={gameState.privacyShield}
        onTogglePrivacy={() => setGameState(prev => ({ ...prev, privacyShield: !prev.privacyShield }))}
        onOpenLookup={() => setIsLookupOpen(true)}
        onResetGame={handleResetGame}
      />

      {/* Main Content Area based on Active Tab */}
      <main style={{ flex: 1, paddingBottom: '24px' }}>
        {/* Tab 1: GAMEPLAY FLOW */}
        {activeTab === 'GAME' && (
          <>
            {gameState.phase === 'SETUP' && (
              <SetupView
                cardMappings={gameState.cardMappings}
                onStartGame={handleStartGame}
                privacyShield={gameState.privacyShield}
              />
            )}

            {gameState.phase.startsWith('NIGHT') && (
              <NightPhaseView
                gameState={gameState}
                onUpdateNightAction={handleUpdateNightAction}
                onFinishNight={handleFinishNight}
                onSetLovers={handleSetLovers}
                privacyShield={gameState.privacyShield}
              />
            )}

            {gameState.phase === 'DAY_DAWN' && (
              <DayDawnView
                gameState={gameState}
                overnightDeadIds={overnightDeadIds}
                overnightReasons={overnightReasons}
                hunterPendingId={hunterPendingId}
                onHunterShoot={handleHunterShoot}
                onProceedToDiscussion={handleProceedToDiscussion}
                privacyShield={gameState.privacyShield}
              />
            )}

            {gameState.phase === 'DAY_DISCUSSION' && (
              <DayDiscussionView
                gameState={gameState}
                onProceedToVoting={handleProceedToVoting}
                privacyShield={gameState.privacyShield}
              />
            )}

            {gameState.phase === 'DAY_VOTING' && (
              <DayVotingView
                gameState={gameState}
                onExecuteHanging={handleExecuteHanging}
                privacyShield={gameState.privacyShield}
              />
            )}
          </>
        )}

        {/* Tab 2: PLAYER ROSTER / SEATING CIRCLE */}
        {activeTab === 'PLAYERS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card-glass" style={{ textAlign: 'center', padding: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }} className="font-cinzel">
                Sơ Đồ Người Chơi ({gameState.players.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Sống: {gameState.players.filter(p => p.isAlive).length} | Chết: {gameState.players.filter(p => !p.isAlive).length}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gameState.players.map(p => {
                const roleDef = ROLE_DEFINITIONS[p.roleId];
                return (
                  <div
                    key={p.id}
                    className={`player-row ${!p.isAlive ? 'dead' : ''}`}
                    style={{ borderLeft: `4px solid ${roleDef.color}` }}
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
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold)',
                      }}>
                        {p.seatNumber}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {p.name} {p.isLover && <Heart size={14} color="#ec4899" style={{ display: 'inline' }} />}
                        </div>
                        {!p.isAlive && (
                          <div style={{ fontSize: '0.72rem', color: '#f87171' }}>
                            {p.deathReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={gameState.privacyShield ? 'privacy-blur' : ''} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: roleDef.color }}>
                          {roleDef.name}
                        </div>
                      </div>
                      <div className="playing-card-badge" style={{ minWidth: '34px', height: '34px', fontSize: '0.9rem' }}>
                        {p.card.rank}{p.card.suit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: HISTORY LOGS */}
        {activeTab === 'LOGS' && (
          <HistoryLogView
            logs={gameState.historyLogs}
            onBack={() => setActiveTab('GAME')}
          />
        )}

        {/* Tab 4: CARDS CHEATSHEET */}
        {activeTab === 'CARDS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card-glass" style={{ padding: '16px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
                🃏 Quy Ước Lá Bài Tây & Ma Sói
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Đưa màn hình này cho người chơi tham khảo khi xem lá bài của mình.
              </p>
            </div>

            {['A', 'K', 'Q', 'J', '10', '2-9'].map(rankKey => {
              const roleId = rankKey === '2-9' ? 'VILLAGER' : gameState.cardMappings[rankKey] || 'VILLAGER';
              const roleDef = ROLE_DEFINITIONS[roleId];
              return (
                <div key={rankKey} className="card-glass" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="playing-card-badge" style={{ minWidth: '46px', height: '42px', fontSize: '1rem' }}>
                      {rankKey}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: roleDef.color }}>
                        {roleDef.name}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {roleDef.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Game Over Modal */}
      {gameState.phase === 'GAME_OVER' && gameState.winner && (
        <GameOverModal
          winner={gameState.winner}
          winReason={gameState.winReason || 'Trận đấu kết thúc!'}
          players={gameState.players}
          onNewGame={handleResetGame}
        />
      )}

      {/* Role Lookup Modal (Floating dialog) */}
      <RoleLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        cardMappings={gameState.cardMappings}
      />

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setActiveTab('GAME');
          }}
          className={`nav-item ${activeTab === 'GAME' ? 'active' : ''}`}
        >
          <Gamepad2 size={20} />
          <span>Ván Đấu</span>
        </button>

        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setActiveTab('PLAYERS');
          }}
          className={`nav-item ${activeTab === 'PLAYERS' ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Người Chơi</span>
        </button>

        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setActiveTab('LOGS');
          }}
          className={`nav-item ${activeTab === 'LOGS' ? 'active' : ''}`}
        >
          <History size={20} />
          <span>Nhật Ký</span>
        </button>

        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setActiveTab('CARDS');
          }}
          className={`nav-item ${activeTab === 'CARDS' ? 'active' : ''}`}
        >
          <BookOpen size={20} />
          <span>Bài Tú</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
