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
import { OnlineLobby } from './components/OnlineLobby';
import { CampfireArena3DView } from './components/arena3d/CampfireArena3DView';
import { Wardrobe3DModal } from './components/arena3d/Wardrobe3DModal';
import { soundEffects } from './utils/soundEffects';
import { Heart, Flame } from 'lucide-react';

const INITIAL_STATE: GameState = {
  round: 1,
  phase: 'SETUP',
  players: [],
  cardMappings: DEFAULT_CARD_MAPPINGS,
  witchPotions: { hasHealPotion: true, hasPoisonPotion: true },
  lastProtectedPlayerId: null,
  currentNightAction: {
    protectedPlayerId: null,
    hunterTargetId: null,
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

  const [activeTab, setActiveTab] = useState<'GAME' | 'PLAYERS' | 'LOGS' | 'CARDS'>('PLAYERS');
  const [appMode, setAppMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [playerViewMode, setPlayerViewMode] = useState<'3D' | '2D'>('3D');

  // Lưu lại người chết qua đêm để DayDawnView hiển thị
  const [overnightDeadIds, setOvernightDeadIds] = useState<string[]>([]);
  const [overnightReasons, setOvernightReasons] = useState<Record<string, string>>({});
  const [hunterPendingId, setHunterPendingId] = useState<string | null>(null);

  // i18n Language State ('vi' | 'en')
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('ma_soi_lang') as 'vi' | 'en') || 'vi';
  });

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      const newLang = (customEvt.detail || localStorage.getItem('ma_soi_lang') || 'vi') as 'vi' | 'en';
      setLang(newLang === 'en' ? 'en' : 'vi');
    };

    window.addEventListener('ma-soi-lang-change', handleLangChange);
    window.addEventListener('storage', handleLangChange);

    return () => {
      window.removeEventListener('ma-soi-lang-change', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, []);

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
          hunterTargetId: null,
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

    // Kẻ Ngốc (IDIOT): Nếu bị treo cổ lần đầu thì lật bài tha chết, mất quyền vote
    if (victim.roleId === 'IDIOT' && !victim.isIdiotRevealed) {
      soundEffects.triggerHaptic('heavy');
      const foolLog = createRoundLog(
        gameState.round,
        'DAY',
        `Biểu Quyết Treo Cổ Ngày ${gameState.round}`,
        [
          `🃏 ${victim.name} (Ghế ${victim.seatNumber}) bị bỏ phiếu treo cổ nhưng đã lật bài KẺ NGỐC!`,
          `Dân làng tha tội chết! Kẻ Ngốc tiếp tục sống nhưng bị tước quyền biểu quyết từ nay về sau.`
        ]
      );

      const updatedPlayers = gameState.players.map(p => {
        if (p.id === hangedPlayerId) {
          return { ...p, isIdiotRevealed: true };
        }
        return p;
      });

      setGameState(prev => ({
        ...prev,
        round: prev.round + 1,
        phase: 'NIGHT_START',
        players: updatedPlayers,
        currentNightAction: {
          protectedPlayerId: null,
          hunterTargetId: null,
          werewolfTargetId: null,
          witchSaved: false,
          witchPoisonTargetId: null,
          seerTargetId: null,
        },
        historyLogs: [...prev.historyLogs, foolLog],
      }));
      soundEffects.playNightAmbiance();
      return;
    }

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
          hunterTargetId: null,
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

  // Navigation Handlers for Floating Top Glass Game Bar
  const handleNavigateTo3DCamp = () => {
    soundEffects.triggerHaptic('medium');
    setAppMode('OFFLINE');
    setActiveTab('PLAYERS');
    setPlayerViewMode('3D');
  };

  const handleNavigateToOnline = () => {
    soundEffects.triggerHaptic('medium');
    setAppMode('ONLINE');
  };

  const handleNavigateToGameMaster = () => {
    soundEffects.triggerHaptic('light');
    setAppMode('OFFLINE');
    setActiveTab('GAME');
  };

  const handleNavigateToPlayers2D = () => {
    soundEffects.triggerHaptic('light');
    setAppMode('OFFLINE');
    setActiveTab('PLAYERS');
    setPlayerViewMode('2D');
  };

  const handleNavigateToLoreOrLogs = () => {
    soundEffects.triggerHaptic('light');
    setAppMode('OFFLINE');
    if (activeTab === 'CARDS') {
      setActiveTab('LOGS');
    } else {
      setActiveTab('CARDS');
    }
  };

  const is3DCampgroundsActive = appMode === 'OFFLINE' && activeTab === 'PLAYERS' && playerViewMode === '3D';

  return (
    <div
      className={`app-container ${appMode === 'ONLINE' ? 'app-container-online' : ''} ${
        is3DCampgroundsActive ? 'arena-3d-active' : ''
      }`}
    >
      {/* Floating Top Glass Game Bar */}
      <Header
        round={gameState.round}
        phase={gameState.phase}
        privacyShield={gameState.privacyShield}
        onTogglePrivacy={() => setGameState(prev => ({ ...prev, privacyShield: !prev.privacyShield }))}
        onOpenLookup={() => setIsLookupOpen(true)}
        onResetGame={handleResetGame}
        mode={appMode}
        activeTab={activeTab}
        playerViewMode={playerViewMode}
        onNavigateTo3DCamp={handleNavigateTo3DCamp}
        onNavigateToOnline={handleNavigateToOnline}
        onNavigateToGameMaster={handleNavigateToGameMaster}
        onNavigateToPlayers2D={handleNavigateToPlayers2D}
        onNavigateToLoreOrLogs={handleNavigateToLoreOrLogs}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
      />

      {/* Main Content Area based on Active Tab & Mode */}
      <main style={{ flex: 1, padding: 0, margin: 0, overflow: is3DCampgroundsActive ? 'hidden' : 'visible' }}>
        {appMode === 'ONLINE' ? (
          <div className="portal-content-stage stage-wide">
            <OnlineLobby onBackToOffline={handleNavigateTo3DCamp} />
          </div>
        ) : (
          <>
            {/* Tab 1: GAMEPLAY FLOW (Quản Trò Bài) */}
            {activeTab === 'GAME' && (
              <div className="portal-content-stage stage-narrow">
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
                    onPhaseChange={(newPhase) => setGameState(prev => ({ ...prev, phase: newPhase }))}
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
              </div>
            )}

            {/* Tab 2: PLAYER ROSTER: 3D FULL VIEWPORT vs 2D ROSTER STAGE */}
            {activeTab === 'PLAYERS' && (
              playerViewMode === '3D' ? (
                /* 3D Campfire Arena Mode — Full Viewport 100vw x 100vh (Bỏ thanh chuyển đổi dư thừa, chiếm trọn 100% màn hình) */
                <div className="arena-3d-wrapper">
                  <CampfireArena3DView
                    players={gameState.players}
                    isNight={gameState.phase.startsWith('NIGHT')}
                    currentRound={gameState.round}
                  />
                </div>
              ) : (
                /* 2D Player Roster Stage */
                <div className="portal-content-stage stage-wide">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <button
                      onClick={handleNavigateTo3DCamp}
                      className="btn btn-ghost has-tooltip tooltip-bottom"
                      data-tooltip={lang === 'vi' ? 'Mở lại Khu Cắm Trại 3D Toàn Màn Hình' : 'Return to Fullscreen 3D Campgrounds'}
                      style={{
                        borderRadius: '12px',
                        border: '1.5px solid #818cf8',
                        background: 'rgba(99, 102, 241, 0.25)',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        color: '#f8fafc',
                        padding: '8px 16px',
                      }}
                    >
                      <Flame size={16} color="#f59e0b" />
                      <span>{lang === 'vi' ? '⛺ Mở Lại Khu Cắm Trại 3D' : '⛺ Open 3D Campgrounds'}</span>
                    </button>
                  </div>

                  <div className="card-glass" style={{ textAlign: 'center', padding: '14px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }} className="font-cinzel">
                      {lang === 'vi'
                        ? `Sơ Đồ Người Chơi (${gameState.players.length})`
                        : `Player Seating Chart (${gameState.players.length})`}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'vi'
                        ? `Sống: ${gameState.players.filter(p => p.isAlive).length} | Chết: ${gameState.players.filter(p => !p.isAlive).length}`
                        : `Alive: ${gameState.players.filter(p => p.isAlive).length} | Dead: ${gameState.players.filter(p => !p.isAlive).length}`}
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
              )
            )}

            {/* Tab 3: HISTORY LOGS */}
            {activeTab === 'LOGS' && (
              <div className="portal-content-stage stage-medium">
                <HistoryLogView
                  logs={gameState.historyLogs}
                  onBack={() => setActiveTab('GAME')}
                />
              </div>
            )}

            {/* Tab 4: ROLE LORE CHEATSHEET */}
            {activeTab === 'CARDS' && (
              <div className="portal-content-stage stage-medium">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="card-glass" style={{ padding: '16px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="font-cinzel">
                      {lang === 'vi' ? '🐺 Bí Kíp Thẻ Bài Ma Sói' : '🐺 Werewolf Role & Card Compendium'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {lang === 'vi'
                        ? 'Tra cứu danh sách vai trò, kỹ năng thần bí và điều kiện thắng của từng phe.'
                        : 'Look up roles, mystical night abilities, and win conditions for each faction.'}
                    </p>
                  </div>

                  {['WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'MAYOR', 'IDIOT', 'VILLAGER'].map(roleKey => {
                    const roleDef = ROLE_DEFINITIONS[roleKey as keyof typeof ROLE_DEFINITIONS];
                    if (!roleDef) return null;
                    return (
                      <div key={roleKey} className="card-glass" style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            minWidth: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: `1.5px solid ${roleDef.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: `0 0 10px ${roleDef.color}30`,
                          }}>
                            {roleDef.name.includes('Sói') ? '🐺' :
                             roleDef.name.includes('Tiên Tri') ? '🔮' :
                             roleDef.name.includes('Bảo Vệ') ? '🛡️' :
                             roleDef.name.includes('Phù Thủy') ? '🧙‍♀️' :
                             roleDef.name.includes('Thợ Săn') ? '🏹' :
                             roleDef.name.includes('Thị Trưởng') ? '👑' :
                             roleDef.name.includes('Kẻ Ngốc') ? '🃏' : '👨‍🌾'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: roleDef.color }}>
                              {roleDef.name}
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.35 }}>
                              {roleDef.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
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

      {/* Wardrobe 3D Modal (Customization) */}
      <Wardrobe3DModal
        isOpen={isWardrobeOpen}
        onClose={() => {
          setIsWardrobeOpen(false);
          window.dispatchEvent(new CustomEvent('ma-soi-profile-update'));
        }}
        onSaveOutfit={() => {
          window.dispatchEvent(new CustomEvent('ma-soi-profile-update'));
        }}
      />
    </div>
  );
};

export default App;
