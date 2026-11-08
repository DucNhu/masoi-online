import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Moon,
  Sun,
  Globe,
  Sparkles,
  Tent,
  Gamepad2,
  Users,
  History,
  BookOpen,
} from 'lucide-react';
import { GamePhase } from '../types/game';
import { ConfirmModal } from './ConfirmModal';
import { BRAND_ASSETS } from '../constants/assets';

export interface HeaderProps {
  round: number;
  phase: GamePhase;
  privacyShield: boolean;
  onTogglePrivacy: () => void;
  onOpenLookup?: () => void;
  onResetGame: () => void;
  mode: 'OFFLINE' | 'ONLINE';
  activeTab?: 'GAME' | 'PLAYERS' | 'LOGS' | 'CARDS';
  playerViewMode?: '3D' | '2D';
  onNavigateTo3DCamp: () => void;
  onNavigateToOnline: () => void;
  onNavigateToGameMaster: () => void;
  onNavigateToPlayers2D: () => void;
  onNavigateToLoreOrLogs: () => void;
  onOpenWardrobe?: () => void;
  onOpenCampgrounds3D?: () => void;
  isCampgrounds3DActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  round,
  phase,
  privacyShield,
  onTogglePrivacy,
  onResetGame,
  mode = 'OFFLINE',
  activeTab = 'PLAYERS',
  playerViewMode = '3D',
  onNavigateTo3DCamp,
  onNavigateToOnline,
  onNavigateToGameMaster,
  onNavigateToPlayers2D,
  onNavigateToLoreOrLogs,
  onOpenWardrobe,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // i18n Language State ('vi' | 'en')
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('ma_soi_lang') as 'vi' | 'en') || 'vi';
  });

  // Player Profile State (Name & Coins)
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('ma_soi_player_name') || 'Thợ Săn Đêm';
  });
  const [playerCoins, setPlayerCoins] = useState<string>(() => {
    return localStorage.getItem('ma_soi_player_coins') || '1500';
  });

  // Event Listeners for language change & profile updates
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvt = e as CustomEvent<string>;
      const newLang = (customEvt.detail || localStorage.getItem('ma_soi_lang') || 'vi') as 'vi' | 'en';
      setLang(newLang === 'en' ? 'en' : 'vi');
    };

    const handleProfileUpdate = () => {
      setPlayerName(localStorage.getItem('ma_soi_player_name') || 'Thợ Săn Đêm');
      setPlayerCoins(localStorage.getItem('ma_soi_player_coins') || '1500');
    };

    window.addEventListener('ma-soi-lang-change', handleLangChange);
    window.addEventListener('storage', handleLangChange);
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('ma-soi-profile-update', handleProfileUpdate);

    handleProfileUpdate();
    const interval = setInterval(handleProfileUpdate, 2500);

    return () => {
      window.removeEventListener('ma-soi-lang-change', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('ma-soi-profile-update', handleProfileUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleToggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    localStorage.setItem('ma_soi_lang', nextLang);
    window.dispatchEvent(new CustomEvent('ma-soi-lang-change', { detail: nextLang }));
  };

  const isNight = phase.startsWith('NIGHT');

  const getPhaseSubtitle = () => {
    if (mode === 'ONLINE') {
      return lang === 'vi' ? 'SẢNH 100% NGƯỜI THẬT' : 'REAL PLAYERS LOBBY';
    }
    if (phase === 'SETUP') {
      return lang === 'vi' ? 'KHU CẮM TRẠI ĐÊM' : 'NIGHT CAMPGROUNDS';
    }
    if (lang === 'en') {
      switch (phase) {
        case 'NIGHT_START': return `Night ${round} • Falling Darkness`;
        case 'NIGHT_CUPID': return `Night ${round} • Cupid Arrow`;
        case 'NIGHT_MINION': return `Night ${round} • Minion Wakeup`;
        case 'NIGHT_BODYGUARD': return `Night ${round} • Bodyguard Shield`;
        case 'NIGHT_HUNTER': return `Night ${round} • Hunter Aim`;
        case 'NIGHT_WEREWOLF': return `Night ${round} • Werewolf Hunt`;
        case 'NIGHT_WITCH': return `Night ${round} • Witch Brew`;
        case 'NIGHT_SEER': return `Night ${round} • Seer Vision`;
        case 'DAY_DAWN': return `Day ${round} • Dawn Breaking`;
        case 'DAY_DISCUSSION': return `Day ${round} • Campfire Debate`;
        case 'DAY_VOTING': return `Day ${round} • Village Trial`;
        case 'DAY_EXECUTION': return `Day ${round} • Lynch Execution`;
        case 'GAME_OVER': return 'Match Concluded';
        default: return 'NIGHT CAMPGROUNDS';
      }
    }
    switch (phase) {
      case 'NIGHT_START': return `Đêm ${round} • Đêm Buông Xuống`;
      case 'NIGHT_CUPID': return `Đêm ${round} • Ghép Đôi Duyên Số`;
      case 'NIGHT_MINION': return `Đêm ${round} • Kẻ Bán Tơ Thức Giấc`;
      case 'NIGHT_BODYGUARD': return `Đêm ${round} • Bảo Vệ Khiên Chắn`;
      case 'NIGHT_HUNTER': return `Đêm ${round} • Thợ Săn Ngắm Bắn`;
      case 'NIGHT_WEREWOLF': return `Đêm ${round} • Ma Sói Săn Đêm`;
      case 'NIGHT_WITCH': return `Đêm ${round} • Phù Thủy Thuốc Tiên`;
      case 'NIGHT_SEER': return `Đêm ${round} • Tiên Tri Khám Phá`;
      case 'DAY_DAWN': return `Ngày ${round} • Bình Minh Rực Rỡ`;
      case 'DAY_DISCUSSION': return `Ngày ${round} • Thảo Luận Lửa Trại`;
      case 'DAY_VOTING': return `Ngày ${round} • Bỏ Phiếu Treo Cổ`;
      case 'DAY_EXECUTION': return `Ngày ${round} • Xử Tử Nghi Can`;
      case 'GAME_OVER': return 'Ván Đấu Kết Thúc';
      default: return 'KHU CẮM TRẠI ĐÊM';
    }
  };

  // Nav Active States
  const is3DCampActive = mode === 'OFFLINE' && activeTab === 'PLAYERS' && playerViewMode === '3D';
  const isOnlineActive = mode === 'ONLINE';
  const isGameMasterActive = mode === 'OFFLINE' && activeTab === 'GAME';
  const is2DActive = mode === 'OFFLINE' && activeTab === 'PLAYERS' && playerViewMode === '2D';
  const isLoreOrLogsActive = mode === 'OFFLINE' && (activeTab === 'CARDS' || activeTab === 'LOGS');

  return (
    <>
      <header className="floating-top-gamebar">
        {/* Cụm Trái: Brand Icon & Title */}
        <div
          className="gamebar-brand-cluster has-tooltip tooltip-bottom"
          data-tooltip={lang === 'vi' ? 'Về Màn Hình Khu Cắm Trại 3D' : 'Back to 3D Campgrounds'}
          onClick={onNavigateTo3DCamp}
        >
          <div
            className="gamebar-brand-icon-box"
            style={{
              borderColor: isNight ? 'rgba(165, 180, 252, 0.45)' : 'rgba(245, 158, 11, 0.45)',
              boxShadow: isNight ? '0 0 16px rgba(99, 102, 241, 0.4)' : '0 0 16px rgba(245, 158, 11, 0.4)',
            }}
          >
            <img
              src={BRAND_ASSETS.appIcon}
              alt="Ma Sói Logo"
              className="gamebar-brand-icon-img"
            />
            <div
              className="gamebar-brand-phase-pill"
              style={{
                background: isNight ? '#312e81' : '#78350f',
              }}
            >
              {isNight ? <Moon size={8} color="#a5b4fc" /> : <Sun size={8} color="#fde047" />}
            </div>
          </div>

          <div className="gamebar-brand-text">
            <div className="gamebar-brand-title">MA SÓI 3D</div>
            <div className="gamebar-brand-subtitle">
              {getPhaseSubtitle()}
            </div>
          </div>
        </div>

        {/* Cụm Giữa: Center Navigation Pills (Thay thế toàn bộ bottom-nav) */}
        <nav className="gamebar-nav-pills" aria-label="Game Navigation">
          {/* Pill 1: Khu Cắm Trại 3D */}
          <button
            type="button"
            onClick={onNavigateTo3DCamp}
            className={`gamebar-nav-pill ${is3DCampActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Khu Cắm Trại Đêm 3D (Đa Túp Lều • Đêm Đồng Thời)'
                : '3D Night Campgrounds (Multi-Tents • Simultaneous Night)'
            }
          >
            <Tent size={16} color={is3DCampActive ? '#facc15' : '#818cf8'} />
            <span>{lang === 'vi' ? '⛺ Khu Cắm Trại 3D' : '⛺ 3D Campgrounds'}</span>
          </button>

          {/* Pill 2: Sảnh Online */}
          <button
            type="button"
            onClick={onNavigateToOnline}
            className={`gamebar-nav-pill ${isOnlineActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Sảnh Nhiều Người Chơi Online (100% Người Thật)'
                : 'Online Multiplayer Lobby (100% Real Players)'
            }
          >
            <Globe size={16} color={isOnlineActive ? '#38bdf8' : '#94a3b8'} />
            <span>{lang === 'vi' ? '🌐 Sảnh Online' : '🌐 Online Lobby'}</span>
          </button>

          {/* Pill 3: Quản Trò Bài */}
          <button
            type="button"
            onClick={onNavigateToGameMaster}
            className={`gamebar-nav-pill ${isGameMasterActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Quản Trò Ván Đấu & Các Pha Ngày Đêm Bằng Bài Tú'
                : 'Game Master & Day/Night Phases with Playing Cards'
            }
          >
            <Gamepad2 size={16} color={isGameMasterActive ? '#c084fc' : '#94a3b8'} />
            <span>{lang === 'vi' ? '🃏 Quản Trò Bài' : '🃏 Game Master'}</span>
          </button>

          {/* Pill 4: Sơ Đồ 2D */}
          <button
            type="button"
            onClick={onNavigateToPlayers2D}
            className={`gamebar-nav-pill ${is2DActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Danh Sách Thẻ Bài 2D Truyền Thống & Vị Trí Ghế'
                : 'Classic 2D Player Roster & Card Badges'
            }
          >
            <Users size={16} color={is2DActive ? '#34d399' : '#94a3b8'} />
            <span>{lang === 'vi' ? '👥 Sơ Đồ 2D' : '👥 2D Roster'}</span>
          </button>

          {/* Pill 5: Bí Kíp & Nhật Ký */}
          <button
            type="button"
            onClick={onNavigateToLoreOrLogs}
            className={`gamebar-nav-pill ${isLoreOrLogsActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Bí Kíp Vai Trò & Nhật Ký Vòng Đấu (Bấm để chuyển qua lại)'
                : 'Role Lore & Round Logs (Click to toggle)'
            }
          >
            {activeTab === 'LOGS' ? (
              <History size={16} color={isLoreOrLogsActive ? '#fbbf24' : '#94a3b8'} />
            ) : (
              <BookOpen size={16} color={isLoreOrLogsActive ? '#fbbf24' : '#94a3b8'} />
            )}
            <span>
              {activeTab === 'LOGS'
                ? (lang === 'vi' ? '📜 Nhật Ký' : '📜 Logs')
                : (lang === 'vi' ? '📖 Bí Kíp' : '📖 Lore')}
            </span>
          </button>
        </nav>

        {/* Cụm Phải: Player Profile & Quick Tools */}
        <div className="gamebar-tools-cluster">
          {/* Badge Tên Nhân Vật • Số Coin (Bấm mở Tủ Đồ 3D) */}
          <button
            type="button"
            onClick={onOpenWardrobe}
            className="gamebar-profile-badge has-tooltip tooltip-bottom"
            data-tooltip={
              lang === 'vi'
                ? 'Hồ Sơ Nhân Vật • Mở Tủ Đồ 3D (Đổi tên & ngoại hình)'
                : 'Player Profile • Open 3D Wardrobe (Edit name & outfit)'
            }
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.82rem', color: '#f1f5f9' }}>
              <span style={{ fontSize: '0.95rem' }}>👤</span>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {playerName}
              </span>
            </span>
            <span style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, fontSize: '0.82rem', color: '#facc15' }}>
              <span>🪙</span>
              <span>{Number(playerCoins || 1500).toLocaleString()}</span>
            </span>
          </button>

          {/* Nút ✨ Tủ Đồ 3D */}
          {onOpenWardrobe && (
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="gamebar-action-btn has-tooltip tooltip-bottom"
              data-tooltip={
                lang === 'vi'
                  ? 'Phòng Thay Đồ 3D (Đổi trang phục & Chibi nhân vật)'
                  : '3D Wardrobe (Wolf Outfits & Customization)'
              }
            >
              <Sparkles size={16} color="#a5b4fc" />
              <span className="gamebar-btn-text">{lang === 'vi' ? 'Tủ Đồ 3D' : 'Wardrobe'}</span>
            </button>
          )}

          {/* Nút 🇻🇳 VI / 🇬🇧 EN */}
          <button
            type="button"
            onClick={handleToggleLang}
            className="gamebar-action-btn has-tooltip tooltip-bottom"
            data-tooltip={
              lang === 'vi'
                ? 'Chuyển sang Tiếng Anh (Switch to English)'
                : 'Switch to Vietnamese (Chuyển sang Tiếng Việt)'
            }
          >
            <span>{lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </button>

          {/* Nút 👁️ Che Bài Chống Nhìn Trộm */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
            data-tooltip={
              lang === 'vi'
                ? 'Chế Độ Che Bài Chống Nhìn Trộm'
                : 'Privacy Shield (Anti-Peeking)'
            }
            style={{
              borderColor: privacyShield ? 'var(--accent-seer)' : 'rgba(255, 255, 255, 0.15)',
              background: privacyShield ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            }}
          >
            {privacyShield ? <EyeOff size={16} color="#38bdf8" /> : <Eye size={16} color="#94a3b8" />}
          </button>

          {/* Nút 🔄 Ván Mới */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom tooltip-end"
            data-tooltip={
              lang === 'vi'
                ? 'Làm Mới / Bắt Đầu Ván Mới'
                : 'Reset / Start New Game'
            }
          >
            <RotateCcw size={16} color="#94a3b8" />
          </button>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={lang === 'vi' ? 'Bắt Đầu Ván Mới?' : 'Start New Game?'}
        message={
          lang === 'vi'
            ? 'Mọi dữ liệu ván đấu hiện tại sẽ được làm mới để chia bài lại từ đầu.'
            : 'All current game progress will be cleared to deal cards anew.'
        }
        confirmText={lang === 'vi' ? 'Xác Nhận' : 'Confirm'}
        cancelText={lang === 'vi' ? 'Hủy Bỏ' : 'Cancel'}
        type="danger"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetGame();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
};
