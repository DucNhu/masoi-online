import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Moon,
  Sun,
  Globe,
  Tent,
  Gamepad2,
  History,
  BookOpen,
} from 'lucide-react';
import { GamePhase } from '../types/game';
import { ConfirmModal } from './ConfirmModal';
import { BRAND_ASSETS } from '../constants/assets';
import { getCurrentLanguageEntry, detectBrowserLanguage, LanguageEntry } from '../utils/i18nCatalog';
import { LanguageSelectorModal } from './LanguageSelectorModal';

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
  onNavigateToPlayers2D?: () => void;
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
  onNavigateToLoreOrLogs,
  onOpenWardrobe,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // i18n Language & Locale State (Tự động phát hiện theo trình duyệt & hỗ trợ 128+ quốc gia)
  const [currentLocale, setCurrentLocale] = useState<LanguageEntry>(() => {
    return getCurrentLanguageEntry();
  });
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Helper tương thích ngược cho các chuỗi hiển thị 'vi' | 'en'
  const lang = currentLocale.code.startsWith('vi') ? 'vi' : 'en';

  // Player Profile State (Name & Coins)
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('ma_soi_player_name') || 'Thợ Săn Đêm';
  });
  const [playerCoins, setPlayerCoins] = useState<string>(() => {
    return localStorage.getItem('ma_soi_player_coins') || '1500';
  });

  // Event Listeners for language change & profile updates
  useEffect(() => {
    // Đảm bảo sync locale mới nhất
    setCurrentLocale(getCurrentLanguageEntry());

    const handleLocaleChange = () => {
      setCurrentLocale(getCurrentLanguageEntry());
    };

    const handleProfileUpdate = () => {
      setPlayerName(localStorage.getItem('ma_soi_player_name') || 'Thợ Săn Đêm');
      setPlayerCoins(localStorage.getItem('ma_soi_player_coins') || '1500');
    };

    window.addEventListener('ma-soi-locale-change', handleLocaleChange);
    window.addEventListener('ma-soi-lang-change', handleLocaleChange);
    window.addEventListener('storage', handleLocaleChange);
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('ma-soi-profile-update', handleProfileUpdate);

    handleProfileUpdate();
    const interval = setInterval(handleProfileUpdate, 2500);

    return () => {
      window.removeEventListener('ma-soi-locale-change', handleLocaleChange);
      window.removeEventListener('ma-soi-lang-change', handleLocaleChange);
      window.removeEventListener('storage', handleLocaleChange);
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('ma-soi-profile-update', handleProfileUpdate);
      clearInterval(interval);
    };
  }, []);


  const isNight = phase.startsWith('NIGHT');

  const getPhaseSubtitle = () => {
    if (mode === 'ONLINE') {
      return lang === 'vi' ? 'SẢNH ONLINE' : 'ONLINE LOBBY';
    }
    if (phase === 'SETUP') {
      return lang === 'vi' ? 'TRẠI ĐÊM 3D' : 'NIGHT CAMP';
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
        default: return 'NIGHT CAMP';
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
      default: return 'TRẠI ĐÊM 3D';
    }
  };

  // Nav Active States
  const is3DCampActive = mode === 'OFFLINE' && activeTab === 'PLAYERS' && playerViewMode === '3D';
  const isOnlineActive = mode === 'ONLINE';
  const isGameMasterActive = mode === 'OFFLINE' && activeTab === 'GAME';
  const isLoreOrLogsActive = mode === 'OFFLINE' && (activeTab === 'CARDS' || activeTab === 'LOGS');

  return (
    <>
      <header className="floating-top-gamebar portal-floating-bar">
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
              boxShadow: isNight ? '0 0 12px rgba(99, 102, 241, 0.35)' : '0 0 12px rgba(245, 158, 11, 0.35)',
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
              {isNight ? <Moon size={7} color="#a5b4fc" /> : <Sun size={7} color="#fde047" />}
            </div>
          </div>

          <div className="gamebar-brand-text">
            <div className="gamebar-brand-title">MA SÓI 3D</div>
            <div className="gamebar-brand-subtitle hide-on-mobile">
              {getPhaseSubtitle()}
            </div>
          </div>
        </div>

        {/* Cụm Giữa: Segmented Switcher gọn nhẹ — chỉ 4 mục cốt lõi (Không lặp emoji) */}
        <nav className="gamebar-nav-pills" aria-label="Game Navigation">
          {/* Mục 1: Trại 3D */}
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
            <Tent size={15} color={is3DCampActive ? '#facc15' : '#818cf8'} />
            <span className="nav-text-desktop">{lang === 'vi' ? 'Trại 3D' : '3D Camp'}</span>
            <span className="nav-text-mobile">{lang === 'vi' ? 'Trại' : 'Camp'}</span>
          </button>

          {/* Mục 2: Online */}
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
            <Globe size={15} color={isOnlineActive ? '#38bdf8' : '#94a3b8'} />
            <span className="nav-text-desktop">Online</span>
            <span className="nav-text-mobile">Online</span>
          </button>

          {/* Mục 3: Quản Trò */}
          <button
            type="button"
            onClick={onNavigateToGameMaster}
            className={`gamebar-nav-pill ${isGameMasterActive ? 'active' : ''} has-tooltip tooltip-bottom`}
            data-tooltip={
              lang === 'vi'
                ? 'Bàn Bài Tây Offline & Quản Trò Ván Đấu'
                : 'Offline Playing Cards & Game Master'
            }
          >
            <Gamepad2 size={15} color={isGameMasterActive ? '#c084fc' : '#94a3b8'} />
            <span className="nav-text-desktop">{lang === 'vi' ? 'Quản Trò' : 'Master'}</span>
            <span className="nav-text-mobile">{lang === 'vi' ? 'Quản Trò' : 'Master'}</span>
          </button>

          {/* Mục 4: Bí Kíp / Nhật Ký */}
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
              <History size={15} color={isLoreOrLogsActive ? '#fbbf24' : '#94a3b8'} />
            ) : (
              <BookOpen size={15} color={isLoreOrLogsActive ? '#fbbf24' : '#94a3b8'} />
            )}
            <span className="nav-text-desktop">
              {activeTab === 'LOGS'
                ? (lang === 'vi' ? 'Nhật Ký' : 'Logs')
                : (lang === 'vi' ? 'Bí Kíp' : 'Lore')}
            </span>
            <span className="nav-text-mobile">
              {activeTab === 'LOGS'
                ? (lang === 'vi' ? 'Nhật Ký' : 'Logs')
                : (lang === 'vi' ? 'Bí Kíp' : 'Lore')}
            </span>
          </button>
        </nav>

        {/* Cụm Phải: Chỉ giữ đúng 3 nút tinh gọn — XÓA các nút thừa/trùng lặp */}
        <div className="gamebar-tools-cluster">
          {/* Nút 1: Hồ Sơ & Tủ Đồ hợp nhất (👤 Tên • 🪙 Coin) -> Bấm mở ngay Phòng Thay Đồ 3D */}
          <button
            type="button"
            onClick={onOpenWardrobe}
            className="gamebar-profile-badge has-tooltip tooltip-bottom"
            data-tooltip={
              lang === 'vi'
                ? 'Hồ Sơ & Tủ Đồ 3D (Đổi tên & ngoại hình)'
                : 'Player Profile & 3D Wardrobe (Edit name & outfit)'
            }
          >
            <span className="profile-badge-user">
              <span style={{ fontSize: '0.88rem' }}>👤</span>
              <span className="profile-badge-name hide-on-mobile">{playerName}</span>
            </span>
            <span className="profile-badge-sep hide-on-mobile" style={{ width: '1px', height: '12px', background: 'rgba(255, 255, 255, 0.2)' }} />
            <span className="profile-badge-coins">
              <span>🪙</span>
              <span>{Number(playerCoins || 1500).toLocaleString()}</span>
            </span>
          </button>

          {/* Nút 2: Ngôn Ngữ (Cờ + Mã Quốc Gia) -> Mở Modal 128 Quốc Gia */}
          <button
            type="button"
            onClick={() => setIsLangModalOpen(true)}
            className="gamebar-lang-btn has-tooltip tooltip-bottom"
            data-tooltip={
              lang === 'vi'
                ? `Ngôn ngữ: ${currentLocale.nativeName} (${currentLocale.country}) • Bấm để chọn 128+ quốc gia`
                : `Language: ${currentLocale.name} (${currentLocale.country}) • Click to select 128+ countries`
            }
          >
            <span style={{ fontSize: '0.92rem' }}>{currentLocale.flag}</span>
            <span style={{ fontWeight: 800 }}>{currentLocale.code.split('-')[0].toUpperCase()}</span>
          </button>

          {/* Nút 3: Chỉ hiện khi đang ở chế độ 🃏 Quản Trò (ẩn ở ⛺ Trại 3D) */}
          {isGameMasterActive && (
            <>
              {/* Nút Che Bài Chống Nhìn Trộm (chỉ hiện khi Quản Trò) */}
              <button
                type="button"
                onClick={onTogglePrivacy}
                className="gamebar-icon-btn has-tooltip tooltip-bottom hide-on-mobile"
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
                {privacyShield ? <EyeOff size={15} color="#38bdf8" /> : <Eye size={15} color="#94a3b8" />}
              </button>

              {/* Nút Làm Mới / Ván Mới */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="gamebar-icon-btn has-tooltip tooltip-bottom tooltip-end"
                data-tooltip={
                  lang === 'vi'
                    ? 'Làm Mới / Bắt Đầu Ván Mới'
                    : 'Reset / Start New Game'
                }
              >
                <RotateCcw size={15} color="#94a3b8" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Modal Chọn 128+ Quốc Gia & Ngôn Ngữ */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

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
