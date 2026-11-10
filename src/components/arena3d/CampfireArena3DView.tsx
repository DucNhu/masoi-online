import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { CampfireScene } from './CampfireScene';
import {
  SeatPlayerInfo,
  PlayerOutfitConfig,
  DEFAULT_OUTFIT,
  DEFAULT_PLAYER_COINS,
  CampTentId,
  CAMP_TENTS,
  NightCombatSkill,
  NIGHT_COMBAT_SKILLS,
  PokemonCombatSkillId,
  OUTFIT_SKINS,
} from './types';
import { Wardrobe3DModal } from './Wardrobe3DModal';
import { NativeBridge } from '../../utils/nativeBridge';
import { narratorVoice } from '../../utils/narratorVoice';
import {
  Sparkles,
  Sun,
  Moon,
  RotateCcw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Tent,
  Footprints,
  ChevronDown,
  Zap,
  Palette,
  Share2,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CampfireArena3DViewProps {
  players?: {
    id: string;
    seatNumber: number;
    name: string;
    isAlive: boolean;
    roleId?: string;
    deathReason?: string;
    isLover?: boolean;
  }[];
  isNight?: boolean;
  currentRound?: number;
  onSeatSelect?: (seatNumber: number) => void;
  onBackToTable?: () => void;
}

interface DawnResolutionData {
  deadSeats: number[];
  savedSeats: number[];
  seerReport?: {
    seatNumber: number;
    playerName: string;
    roleFaction: string;
    isWolf: boolean;
  };
  eventLogs: string[];
}

const VALID_TENT_IDS: CampTentId[] = ['tent-1', 'tent-2', 'tent-3', 'tent-4'];

export const CampfireArena3DView: React.FC<CampfireArena3DViewProps> = ({
  players,
  isNight: propIsNight = true,
  currentRound = 1,
  onSeatSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<CampfireScene | null>(null);
  const handleSeatInteractionRef = useRef<(seatNumber: number) => void>(() => {});

  // Ngôn ngữ VI / EN
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    try {
      return (localStorage.getItem('ma_soi_lang') as 'vi' | 'en') || 'vi';
    } catch {
      return 'vi';
    }
  });

  // Tên người chơi & Số dư Coin
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_name');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return lang === 'en' ? 'Night Camper' : 'Thợ Săn Đêm';
  });

  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_coins');
      if (saved) return Number(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PLAYER_COINS;
  });

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [isNightMode, setIsNightMode] = useState<boolean>(propIsNight);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);

  // Quản lý Túp Lều & Chế độ Đi Dạo (Camp Tents & Roam Mode)
  // Đọc ?tent= từ URL khi khởi tạo trang chủ
  const [activeTentId, setActiveTentId] = useState<CampTentId>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('tent') as CampTentId;
      if (param && VALID_TENT_IDS.includes(param)) {
        return param;
      }
    }
    return 'tent-1';
  });
  const [isTentMenuOpen, setIsTentMenuOpen] = useState<boolean>(false);
  const [isRoaming, setIsRoaming] = useState<boolean>(false);

  // Thông báo Toast khi sao chép link mời vào Túp Lều
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const copyToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pha Đêm Đồng Thời (Simultaneous Night Phase - 25s)
  const [isSimultaneousNight, setIsSimultaneousNight] = useState<boolean>(false);
  const [nightCountdown, setNightCountdown] = useState<number>(25);
  const [selectedSkill, setSelectedSkill] = useState<NightCombatSkill | null>(null);
  const [lockedAction, setLockedAction] = useState<{
    skillId: PokemonCombatSkillId;
    targetSeat: number;
  } | null>(null);
  const [botLiveTicker, setBotLiveTicker] = useState<string>('');

  // Pha Bình Minh & Thảo Luận Ban Ngày (Dawn & Day Discussion)
  const [dawnData, setDawnData] = useState<DawnResolutionData | null>(null);
  const [isDayDiscussion, setIsDayDiscussion] = useState<boolean>(false);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [lynchNotice, setLynchNotice] = useState<string | null>(null);

  // Quản Trò AI & Phụ đề xướng âm thanh (AI Narrator & Live Subtitle)
  const [isVoiceOn, setIsVoiceOn] = useState<boolean>(() => narratorVoice.isVoiceEnabled());
  const [narratorSubtitle, setNarratorSubtitle] = useState<string | null>(null);

  // Đăng ký nhận phụ đề Quản Trò AI và trạng thái bật/tắt
  useEffect(() => {
    const unsubSub = narratorVoice.subscribeSubtitle(setNarratorSubtitle);
    const unsubVoice = narratorVoice.subscribeEnabled(setIsVoiceOn);
    return () => {
      unsubSub();
      unsubVoice();
      narratorVoice.stop();
    };
  }, []);

  const [myOutfit, setMyOutfit] = useState<PlayerOutfitConfig>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_outfit');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OUTFIT;
  });

  // Lưu trạng thái sống chết của 10 ghế (có thể cập nhật từ kết quả đêm)
  const [seatOverride, setSeatOverride] = useState<Record<number, { isAlive: boolean; deathReason?: string }>>({});

  // Lắng nghe sự kiện đổi ngôn ngữ toàn cục
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<'vi' | 'en'>;
      if (customEvent.detail) setLang(customEvent.detail);
    };
    window.addEventListener('ma-soi-lang-change', handleLangChange);
    return () => window.removeEventListener('ma-soi-lang-change', handleLangChange);
  }, []);

  const toggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    try {
      localStorage.setItem('ma_soi_lang', nextLang);
      window.dispatchEvent(new CustomEvent('ma-soi-lang-change', { detail: nextLang }));
    } catch {
      // ignore
    }
    NativeBridge.hapticImpact('light');
  };

  // Đồng bộ props ban đêm khi có thay đổi từ game engine ngoài
  useEffect(() => {
    setIsNightMode(propIsNight);
    if (sceneRef.current) {
      sceneRef.current.setPhase(propIsNight);
    }
  }, [propIsNight]);

  // Bộ sưu tập 10 nhân vật cắm trại đa dạng quanh đống lửa
  const CAMPER_PRESETS = useMemo(
    () => [
      {
        roleName: 'Phượt Thủ Cắm Trại',
        roleNameEn: 'Outdoor Camper',
        icon: '🏕️',
        skinId: 'WOLF_GRAY' as const,
        hatId: 'CONICAL_HAT' as const,
        eyeGlowId: 'RED' as const,
        backItemId: 'NONE' as const,
      },
      {
        roleName: 'Pháp Sư Tiên Tri',
        roleNameEn: 'Arcane Seer',
        icon: '🔮',
        skinId: 'WOLF_SNOW' as const,
        hatId: 'WITCH' as const,
        eyeGlowId: 'CYAN' as const,
        backItemId: 'CAPE' as const,
      },
      {
        roleName: 'Thợ Săn Rừng Thông',
        roleNameEn: 'Forest Hunter',
        icon: '🏹',
        skinId: 'WOLF_GOLD' as const,
        hatId: 'COWBOY' as const,
        eyeGlowId: 'YELLOW' as const,
        backItemId: 'SWORD' as const,
      },
      {
        roleName: 'Phù Thủy Giả Kim',
        roleNameEn: 'Alchemist Witch',
        icon: '🧪',
        skinId: 'WOLF_SHADOW' as const,
        hatId: 'WITCH' as const,
        eyeGlowId: 'PURPLE' as const,
        backItemId: 'POTION' as const,
      },
      {
        roleName: 'Nữ Sinh Cắm Trại',
        roleNameEn: 'Camper Girl',
        icon: '🌸',
        skinId: 'CAMPER_GIRL' as const,
        hatId: 'BANDANA' as const,
        eyeGlowId: 'CYAN' as const,
        backItemId: 'NONE' as const,
      },
      {
        roleName: 'Hồ Ly Tinh Linh',
        roleNameEn: 'Spirit Kitsune',
        icon: '🦊',
        skinId: 'KITSUNE_FOX' as const,
        hatId: 'CROWN' as const,
        eyeGlowId: 'YELLOW' as const,
        backItemId: 'SHIELD' as const,
      },
      {
        roleName: 'Hướng Dẫn Dã Ngoại',
        roleNameEn: 'Trail Guide',
        icon: '🏕️',
        skinId: 'WOLF_GRAY' as const,
        hatId: 'CONICAL_HAT' as const,
        eyeGlowId: 'RED' as const,
        backItemId: 'CAPE' as const,
      },
      {
        roleName: 'Sói Hồng Nguyệt',
        roleNameEn: 'Blood Werewolf',
        icon: '🐺',
        skinId: 'WOLF_BLOOD' as const,
        hatId: 'NONE' as const,
        eyeGlowId: 'RED' as const,
        backItemId: 'NONE' as const,
      },
      {
        roleName: 'Xạ Thủ Rừng Tây',
        roleNameEn: 'Wild Marksman',
        icon: '🏹',
        skinId: 'WOLF_GOLD' as const,
        hatId: 'BANDANA' as const,
        eyeGlowId: 'YELLOW' as const,
        backItemId: 'SWORD' as const,
      },
      {
        roleName: 'Tinh Linh Ánh Trăng',
        roleNameEn: 'Moonlight Spirit',
        icon: '🔮',
        skinId: 'WOLF_SNOW' as const,
        hatId: 'CROWN' as const,
        eyeGlowId: 'CYAN' as const,
        backItemId: 'POTION' as const,
      },
    ],
    []
  );

  // Tạo dữ liệu cho 10 ghế
  const seatsData: SeatPlayerInfo[] = useMemo(() => {
    const list: SeatPlayerInfo[] = [];
    for (let i = 1; i <= 10; i++) {
      const p = players?.find((item) => item.seatNumber === i);
      const isMe = i === 1;
      const override = seatOverride[i];

      const isAlive = override ? override.isAlive : p ? p.isAlive : true;
      const deathReason = override?.deathReason || p?.deathReason;
      const preset = CAMPER_PRESETS[i - 1];

      const mySkinInfo = OUTFIT_SKINS.find((s) => s.id === myOutfit.skinId);
      const currentIcon = isMe ? mySkinInfo?.icon || '🏕️' : preset.icon;
      const currentTitle = isMe
        ? lang === 'en' ? mySkinInfo?.nameEn || 'Outdoor Camper' : mySkinInfo?.name || 'Phượt Thủ Cắm Trại'
        : lang === 'en' ? preset.roleNameEn : preset.roleName;

      const currentName = isMe
        ? playerName
        : p?.name || `${currentTitle} #${i}`;

      list.push({
        seatNumber: i,
        name: currentName,
        isAlive,
        isWerewolf: Boolean(p?.roleId === 'WEREWOLF' || p?.roleId?.includes('WOLF') || i === 2 || i === 8),
        deathReason,
        characterIcon: currentIcon,
        characterTitle: currentTitle,
        outfit: isMe
          ? myOutfit
          : {
              skinId: preset.skinId,
              hatId: preset.hatId,
              eyeGlowId: preset.eyeGlowId,
              backItemId: preset.backItemId,
            },
      });
    }
    return list;
  }, [players, myOutfit, seatOverride, playerName, lang, CAMPER_PRESETS]);

  // Khởi tạo Three.js CampfireScene
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new CampfireScene(canvasRef.current);
    sceneRef.current = scene;

    scene.setPhase(isNightMode);
    scene.updateSeatsState(seatsData);

    // Tự động chọn và bay camera tới đúng Túp Lều nếu URL có ?tent=...
    if (activeTentId && activeTentId !== 'tent-1') {
      scene.switchTent(activeTentId);
    }

    scene.setOnSeatClick((seatNumber) => {
      NativeBridge.hapticImpact('medium');
      handleSeatInteractionRef.current(seatNumber);
    });

    scene.setOnSeatHover((seatNumber) => {
      setHoveredSeat(seatNumber);
    });

    scene.setOnTentNearby((tentId) => {
      setActiveTentId(tentId);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.get('tent') !== tentId) {
          url.searchParams.set('tent', tentId);
          window.history.replaceState({}, '', url.toString());
        }
      }
      NativeBridge.hapticImpact('light');
    });

    scene.setOnRoamStateChange((roamState) => {
      setIsRoaming(roamState);
    });

    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        sceneRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    const resizeTimer = setTimeout(handleResize, 50);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Lắng nghe thay đổi URL qua back/forward trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const param = new URLSearchParams(window.location.search).get('tent') as CampTentId;
      if (param && VALID_TENT_IDS.includes(param) && param !== activeTentId) {
        setActiveTentId(param);
        if (sceneRef.current) {
          sceneRef.current.switchTent(param);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTentId]);

  // Dọn dẹp toast timeout khi unmount
  useEffect(() => {
    return () => {
      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
    };
  }, []);

  // Lắng nghe Fullscreen change
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setTimeout(() => {
        if (canvasRef.current && sceneRef.current) {
          sceneRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        }
      }, 100);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Cập nhật trạng thái ghế trong Three.js
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateSeatsState(seatsData);
    }
  }, [seatsData, isNightMode]);

  // Điều hướng Túp Lều & Đồng bộ URL ?tent=...
  const handleTentSelect = (tentId: CampTentId) => {
    setActiveTentId(tentId);
    setIsTentMenuOpen(false);
    if (sceneRef.current) {
      sceneRef.current.switchTent(tentId);
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tent', tentId);
      window.history.replaceState({}, '', url.toString());
    }
    NativeBridge.hapticImpact('medium');
  };
  const handleSelectTent = handleTentSelect;

  // Tính Năng "🔗 Mời Bạn Vào Lều" (Share / Copy Tent Link)
  const handleShareTentLink = async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tent', activeTentId);
    const shareUrl = url.toString();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      const targetTent = CAMP_TENTS.find((t) => t.id === activeTentId) || CAMP_TENTS[0];
      const tentName = lang === 'en' ? targetTent.nameEn : targetTent.name;
      const msg =
        lang === 'en'
          ? `✅ Copied invite link for [${tentName}]! Share with friends to gather around the campfire.`
          : `✅ Đã sao chép link mời vào [${tentName}]! Gửi cho bạn bè để cùng ngồi quanh đống lửa.`;

      if (copyToastTimeoutRef.current) {
        clearTimeout(copyToastTimeoutRef.current);
      }
      setCopyToast(msg);
      copyToastTimeoutRef.current = setTimeout(() => {
        setCopyToast(null);
      }, 3000);

      NativeBridge.hapticNotification('success');
    } catch (err) {
      console.error('Failed to copy tent link:', err);
    }
  };

  const toggleRoamMode = () => {
    const nextRoam = !isRoaming;
    setIsRoaming(nextRoam);
    if (sceneRef.current) {
      sceneRef.current.setRoaming(nextRoam);
    }
    NativeBridge.hapticImpact('medium');
  };

  // Pha Đêm Đồng Thời
  const startSimultaneousNight = () => {
    setIsSimultaneousNight(true);
    setNightCountdown(25);
    setSelectedSkill(NIGHT_COMBAT_SKILLS[0]);
    setLockedAction(null);
    setDawnData(null);
    setIsDayDiscussion(false);
    setLynchNotice(null);
    setIsNightMode(true);
    if (sceneRef.current) {
      sceneRef.current.setPhase(true);
    }
    narratorVoice.speak(
      lang === 'en'
        ? '🐺 Creatures of the night, awaken and choose your targets in 25 seconds!'
        : '🐺 Các vai trò bóng đêm hãy thức tỉnh và thực hiện nhiệm vụ trong 25 giây!',
      { soundIntro: 'wolf', lang: lang === 'en' ? 'en-US' : 'vi-VN' }
    );
    NativeBridge.hapticNotification('success');
  };

  // Đồng hồ đếm ngược 25 giây
  useEffect(() => {
    if (!isSimultaneousNight) return;
    if (nightCountdown <= 0) {
      resolveSimultaneousNight();
      return;
    }

    const timer = setInterval(() => {
      setNightCountdown((prev) => prev - 1);
    }, 1000);

    if (nightCountdown === 22) {
      setBotLiveTicker(
        lang === 'en'
          ? '🐺 Wolves are conferring on target...'
          : '🐺 Bầy sói đang bàn bạc mục tiêu cắn xé...'
      );
    } else if (nightCountdown === 18) {
      setBotLiveTicker(
        lang === 'en'
          ? '🛡️ Bodyguard (Seat #5) deployed Light Barrier!'
          : '🛡️ Bảo Vệ (Ghế #5) đã giương Khiên Ánh Sáng!'
      );
    } else if (nightCountdown === 14) {
      setBotLiveTicker(
        lang === 'en'
          ? '🔮 Seer (Seat #7) is peering into souls...'
          : '🔮 Tiên Tri (Ghế #7) đang thấu thị danh tính...'
      );
    } else if (nightCountdown === 9) {
      setBotLiveTicker(
        lang === 'en'
          ? '🧪 Witch (Seat #2) opened her mystical vial...'
          : '🧪 Phù Thủy (Ghế #2) đã mở bình độc dược huyền bí...'
      );
    } else if (nightCountdown === 4) {
      setBotLiveTicker(
        lang === 'en'
          ? '🏹 Hunter (Seat #9) locked aiming crosshair...'
          : '🏹 Thợ Săn (Ghế #9) đã khóa tâm ngắm bắn...'
      );
    }

    return () => clearInterval(timer);
  }, [isSimultaneousNight, nightCountdown, lang]);

  // Phân giải kết quả đồng thời
  const resolveSimultaneousNight = useCallback(() => {
    setIsSimultaneousNight(false);
    setIsNightMode(false);
    if (sceneRef.current) {
      sceneRef.current.setPhase(false);
      sceneRef.current.highlightSeat(null);
    }

    const wolfTarget =
      lockedAction?.skillId === 'WOLF_BITE' && lockedAction.targetSeat ? lockedAction.targetSeat : 4;
    const guardTarget =
      lockedAction?.skillId === 'GUARD_SHIELD' && lockedAction.targetSeat ? lockedAction.targetSeat : 4;
    const witchTarget =
      lockedAction?.skillId === 'WITCH_POTION' && lockedAction.targetSeat ? lockedAction.targetSeat : null;
    const seerTarget =
      lockedAction?.skillId === 'SEER_GAZE' && lockedAction.targetSeat ? lockedAction.targetSeat : 2;

    const deadSeats: number[] = [];
    const savedSeats: number[] = [];
    const logs: string[] = [];

    if (wolfTarget === guardTarget) {
      savedSeats.push(wolfTarget);
      logs.push(
        lang === 'en'
          ? `🛡️ Bodyguard's Light Barrier blocked the wolf assault at Seat #${wolfTarget}! Player is safe.`
          : `🛡️ Khiên Ánh Sáng của Bảo Vệ đã đỡ trọn cú cào xé của Sói tại Ghế #${wolfTarget}! Người chơi bình an vô sự.`
      );
    } else {
      deadSeats.push(wolfTarget);
      logs.push(
        lang === 'en'
          ? `🐺 The Wolves mauled Seat #${wolfTarget} under the midnight moon!`
          : `🐺 Bầy Sói đã cắn rách Ghế #${wolfTarget} trong đêm đen!`
      );
    }

    if (witchTarget && !deadSeats.includes(witchTarget) && witchTarget !== wolfTarget) {
      deadSeats.push(witchTarget);
      logs.push(
        lang === 'en'
          ? `🧪 The Witch's deadly poison eliminated Seat #${witchTarget}!`
          : `🧪 Bình Dược Độc của Phù Thủy đã hạ gục Ghế #${witchTarget}!`
      );
    }

    if (deadSeats.length > 0) {
      setSeatOverride((prev) => {
        const next = { ...prev };
        deadSeats.forEach((seat) => {
          next[seat] = {
            isAlive: false,
            deathReason: lang === 'en' ? 'Perished during simultaneous night' : 'Bị sát hại trong đêm đồng thời',
          };
        });
        return next;
      });
    }

    const targetPlayer = seatsData.find((s) => s.seatNumber === seerTarget);
    const isWolf = targetPlayer?.isWerewolf ?? (seerTarget === 2 || seerTarget === 8);
    const seerReport = {
      seatNumber: seerTarget,
      playerName: targetPlayer?.name || `Player ${seerTarget}`,
      roleFaction: isWolf
        ? lang === 'en' ? 'WEREWOLF FACTION' : 'PHE MA SÓI'
        : lang === 'en' ? 'VILLAGE FACTION' : 'PHE DÂN LÀNG',
      isWolf,
    };

    setDawnData({
      deadSeats,
      savedSeats,
      seerReport,
      eventLogs: logs,
    });

    const dawnAnnouncement =
      deadSeats.length > 0
        ? lang === 'en'
          ? `☀️ Dawn has arrived! Last night, ${deadSeats.length} camper(s) fell at seat(s) ${deadSeats.join(', ')}.`
          : `☀️ Trời đã sáng! Đêm qua có ${deadSeats.length} người tử nạn ở ghế số ${deadSeats.join(', ')}.`
        : lang === 'en'
        ? '☀️ Dawn has arrived! It was a peaceful night, everyone survived.'
        : '☀️ Trời đã sáng! Đêm qua là một đêm bình yên, không có ai ngã xuống.';

    narratorVoice.speak(dawnAnnouncement, {
      soundIntro: 'dawn',
      lang: lang === 'en' ? 'en-US' : 'vi-VN',
    });

    setIsDayDiscussion(true);
    setVotes({});
    setHasVoted(false);
    NativeBridge.hapticNotification('success');
  }, [lockedAction, seatsData, lang]);

  // Tương tác ghế
  const handleSeatInteraction = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    if (onSeatSelect) onSeatSelect(seatNumber);

    if (isSimultaneousNight && selectedSkill) {
      setLockedAction({
        skillId: selectedSkill.id,
        targetSeat: seatNumber,
      });
      if (sceneRef.current) {
        sceneRef.current.highlightSeat(seatNumber, selectedSkill.highlightHex);
      }
      NativeBridge.hapticImpact('heavy');
      return;
    }

    if (isDayDiscussion && !hasVoted) {
      const p = seatsData.find((s) => s.seatNumber === seatNumber);
      if (p && p.isAlive) {
        setVotes((prev) => ({
          ...prev,
          [seatNumber]: (prev[seatNumber] || 0) + 1,
        }));
        setHasVoted(true);
        NativeBridge.hapticImpact('medium');
      }
    }
  };
  handleSeatInteractionRef.current = handleSeatInteraction;

  const handleSelectSkill = (skill: NightCombatSkill) => {
    setSelectedSkill(skill);
    NativeBridge.hapticImpact('light');
    if (lockedAction?.targetSeat && sceneRef.current) {
      sceneRef.current.highlightSeat(lockedAction.targetSeat, skill.highlightHex);
    }
  };

  const executeLynching = () => {
    let topSeat = 0;
    let maxV = -1;
    Object.entries(votes).forEach(([s, count]) => {
      const seat = Number(s);
      if (count > maxV) {
        maxV = count;
        topSeat = seat;
      }
    });

    if (topSeat > 0) {
      const victim = seatsData.find((s) => s.seatNumber === topSeat);
      setSeatOverride((prev) => ({
        ...prev,
        [topSeat]: {
          isAlive: false,
          deathReason: lang === 'en' ? 'Lynched by village vote' : 'Bị dân làng biểu quyết treo cổ',
        },
      }));
      const notice =
        lang === 'en'
          ? `⚖️ The Village voted to exile Seat #${topSeat} (${victim?.name})!`
          : `⚖️ Dân làng đã biểu quyết treo cổ Ghế #${topSeat} (${victim?.name})!`;
      setLynchNotice(notice);
      narratorVoice.speak(notice, {
        soundIntro: 'gavel',
        lang: lang === 'en' ? 'en-US' : 'vi-VN',
      });
      NativeBridge.hapticNotification('warning');
    }
  };

  // Phím tắt bàn phím PC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();

      // Phím tắt nhanh 3D toàn cục
      if (key === 'R') {
        sceneRef.current?.resetCamera();
        NativeBridge.hapticImpact('light');
        return;
      }
      if (key === 'N') {
        toggleNightDay();
        return;
      }
      if (key === 'V') {
        const next = !narratorVoice.isVoiceEnabled();
        narratorVoice.setVoiceEnabled(next);
        NativeBridge.hapticImpact('light');
        return;
      }
      if (key === 'F') {
        toggleFullscreen();
        return;
      }

      if (!isSimultaneousNight) return;

      const matched = NIGHT_COMBAT_SKILLS.find((s) => s.hotkey === key);
      if (matched) {
        handleSelectSkill(matched);
      }
      if (/^[1-9]$/.test(e.key)) {
        handleSeatInteraction(Number(e.key));
      } else if (e.key === '0') {
        handleSeatInteraction(10);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSimultaneousNight, selectedSkill, isNightMode, isFullscreen, lang]);

  const toggleNightDay = () => {
    setIsNightMode((prev) => {
      const nextState = !prev;
      if (sceneRef.current) {
        sceneRef.current.setPhase(nextState);
      }
      if (nextState) {
        narratorVoice.speak(
          lang === 'en'
            ? '🌙 Night has fallen over the campgrounds. The village falls asleep...'
            : '🌙 Đêm đã buông xuống trên khu cắm trại. Cả làng hãy nhắm mắt và chìm vào giấc ngủ...',
          { soundIntro: 'night', lang: lang === 'en' ? 'en-US' : 'vi-VN' }
        );
      }
      return nextState;
    });
    NativeBridge.hapticImpact('light');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
    NativeBridge.hapticImpact('light');
    setTimeout(() => {
      if (canvasRef.current && sceneRef.current) {
        sceneRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    }, 100);
  };

  const currentTent = CAMP_TENTS.find((t) => t.id === activeTentId) || CAMP_TENTS[0];
  const selectedPlayer = seatsData.find((s) => s.seatNumber === selectedSeat);
  const hoveredPlayer = hoveredSeat ? seatsData.find((s) => s.seatNumber === hoveredSeat) : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: '#070710',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'none',
        border: 'none',
        zIndex: isFullscreen ? 99999 : 1,
        fontFamily: "'Montserrat', 'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* Tooltip & Pulse Styles */}
      <style>{`
        .has-tooltip { position: relative; }
        .has-tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          color: #f8fafc;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.12s ease, transform 0.12s ease;
          z-index: 9999;
        }
        .has-tooltip:hover::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-2px);
        }
        .has-tooltip.tooltip-bottom::after {
          bottom: auto;
          top: calc(100% + 8px);
        }
        .has-tooltip.tooltip-left::after {
          bottom: auto;
          top: 50%;
          left: auto;
          right: calc(100% + 8px);
          transform: translateY(-50%);
        }
        .has-tooltip.tooltip-left:hover::after {
          transform: translateY(-50%) translateX(-2px);
        }
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 12px rgba(129, 140, 248, 0.4); }
          50% { box-shadow: 0 0 24px rgba(168, 85, 247, 0.8); }
        }
        @media (max-width: 640px) {
          .roam-label { display: none !important; }
        }
      `}</style>

      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isRoaming ? 'crosshair' : 'grab',
        }}
      />

      {/* === GÓC TRÁI TRÊN: 1 PILL TÚP LỀU DROPDOWN + MỜI BẠN + ĐI DẠO === */}
      <div
        className="hud-pill-bar top-left-tent-bar"
        style={{
          position: 'absolute',
          top: isFullscreen ? '14px' : '72px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 25,
          pointerEvents: 'auto',
          maxWidth: 'calc(100vw - 68px)',
        }}
      >
        {/* Dropdown 4 Túp Lều Cắm Trại */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsTentMenuOpen((prev) => !prev)}
            className="hud-btn has-tooltip tooltip-bottom"
            data-tooltip={lang === 'en' ? 'Click to change Camp Tent' : 'Nhấp để chọn đổi Túp Lều'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1.5px solid ${currentTent.themeColor || 'rgba(255,255,255,0.2)'}`,
              height: '34px',
              minHeight: '34px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#f8fafc',
              boxShadow: `0 0 10px ${currentTent.themeColor}33`,
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>{currentTent.banner.split(' ')[0] || '⛺'}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap' }}>
              {lang === 'en' ? currentTent.nameEn : currentTent.name}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '8px',
                background: `${currentTent.themeColor}33`,
                color: currentTent.themeColor,
                border: `1px solid ${currentTent.themeColor}66`,
              }}
            >
              {currentTent.playerCount}/{currentTent.maxPlayers}
            </span>
            <ChevronDown
              size={14}
              color="#cbd5e1"
              style={{
                transform: isTentMenuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                marginLeft: '2px',
              }}
            />
          </button>

          {/* Popover Menu 4 Túp Lều */}
          {isTentMenuOpen && (
            <>
              {/* Invisible Backdrop để đóng popover khi click ngoài */}
              <div
                onClick={() => setIsTentMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  background: 'rgba(10, 15, 29, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.85)',
                  minWidth: '230px',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    padding: '4px 8px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Tent size={12} color="#f59e0b" />
                  <span>{lang === 'en' ? 'Select Camp Tent' : 'Chọn Túp Lều Cắm Trại'}</span>
                </div>
                {CAMP_TENTS.map((tent) => {
                  const isActive = tent.id === activeTentId;
                  return (
                    <button
                      key={tent.id}
                      onClick={() => {
                        handleTentSelect(tent.id);
                        setIsTentMenuOpen(false);
                      }}
                      style={{
                        background: isActive
                          ? `linear-gradient(135deg, ${tent.themeColor}33 0%, ${tent.themeColor}66 100%)`
                          : 'transparent',
                        border: `1px solid ${isActive ? tent.themeColor : 'transparent'}`,
                        borderRadius: '12px',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        color: '#f8fafc',
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{tent.banner}</span>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isActive ? '#ffffff' : '#e2e8f0' }}>
                            {lang === 'en' ? tent.nameEn : tent.name}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                            {lang === 'en' ? tent.taglineEn : tent.tagline}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.4)',
                          color: tent.themeColor,
                          border: `1px solid ${tent.themeColor}55`,
                        }}
                      >
                        {tent.playerCount}/{tent.maxPlayers}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Vạch mảnh 1px phân tách */}
        <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.14)', margin: '0 2px' }} />

        {/* Nút 🔗 Mời Bạn Vào Lều (Sao Chép Link) */}
        <button
          onClick={handleShareTentLink}
          className="hud-icon-btn has-tooltip tooltip-bottom"
          data-tooltip={
            lang === 'en'
              ? `Copy invite link for ${currentTent.nameEn} (?tent=${activeTentId})`
              : `Sao chép link mời bạn bè vào ${currentTent.name} (?tent=${activeTentId})`
          }
          style={{
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
          }}
        >
          <Share2 size={15} color="#38bdf8" />
        </button>

        {/* Vạch mảnh 1px phân tách */}
        <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.14)', margin: '0 2px' }} />

        {/* Nút 🚶 Đứng Lên Đi Dạo WASD / Ngồi Xuống */}
        <button
          onClick={toggleRoamMode}
          className="hud-btn has-tooltip tooltip-bottom roam-btn"
          data-tooltip={
            isRoaming
              ? lang === 'en' ? 'Sit back by the campfire' : 'Ngồi xuống quanh đống lửa'
              : lang === 'en' ? 'Stand up & walk around camp freely (WASD)' : 'Đứng dậy đi bộ khám phá khu cắm trại (WASD)'
          }
          style={{
            background: isRoaming
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${isRoaming ? '#34d399' : 'rgba(255, 255, 255, 0.16)'}`,
            boxShadow: isRoaming ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
          }}
        >
          <Footprints size={15} color={isRoaming ? '#ffffff' : '#38bdf8'} />
          <span className="roam-label" style={{ fontSize: '0.74rem', fontWeight: 800 }}>
            {isRoaming
              ? (lang === 'en' ? 'Sit' : 'Ngồi')
              : (lang === 'en' ? 'Walk' : 'Đi dạo')}
          </span>
        </button>
      </div>

      {/* === CẠNH PHẢI: THANH CÔNG CỤ DỌC MẢNH (VERTICAL COMPACT TOOLBAR - 44px) === */}
      <div
        className="hud-right-toolbar"
        style={{
          position: 'absolute',
          top: isFullscreen ? '14px' : '72px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(10, 15, 29, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          padding: '4px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          zIndex: 25,
          pointerEvents: 'auto',
          width: '44px',
          boxSizing: 'border-box',
        }}
      >
        {/* Nút ✨ Mở Tủ Đồ & Thử Mẫu 3D (Viền tím neon nổi bật) */}
        <button
          onClick={() => {
            setIsWardrobeOpen(true);
            NativeBridge.hapticImpact('medium');
          }}
          className="hud-icon-btn has-tooltip tooltip-left"
          data-tooltip={lang === 'en' ? '✨ 3D Wardrobe & Character Studio' : '✨ Tủ Đồ & Thử Mẫu Nhân Vật 3D'}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
            border: '1.5px solid #c084fc',
            boxShadow: '0 0 12px rgba(192, 132, 252, 0.4)',
          }}
        >
          <Sparkles size={16} color="#e9d5ff" />
        </button>

        <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '1px 0' }} />

        {/* Nút 🌙 / ☀️ Đổi Ngày / Đêm */}
        <button
          onClick={toggleNightDay}
          className="hud-icon-btn has-tooltip tooltip-left"
          data-tooltip={
            isNightMode
              ? (lang === 'en' ? '☀️ Switch to Day [Key N]' : '☀️ Chuyển sang Ban Ngày [Phím N]')
              : (lang === 'en' ? '🌙 Switch to Night [Key N]' : '🌙 Chuyển sang Ban Đêm [Phím N]')
          }
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
          }}
        >
          {isNightMode ? <Sun size={16} color="#facc15" /> : <Moon size={16} color="#a5b4fc" />}
        </button>

        {/* Nút 🔊 / 🔇 Bật/Tắt Giọng Quản Trò AI */}
        <button
          onClick={() => {
            const next = !isVoiceOn;
            narratorVoice.setVoiceEnabled(next);
            NativeBridge.hapticImpact('light');
          }}
          className="hud-icon-btn has-tooltip tooltip-left"
          data-tooltip={
            isVoiceOn
              ? (lang === 'en' ? '🔊 AI Narrator: ON [Key V]' : '🔊 Quản Trò AI: BẬT [Phím V]')
              : (lang === 'en' ? '🔇 AI Narrator: OFF [Key V]' : '🔇 Quản Trò AI: TẮT [Phím V]')
          }
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
            background: isVoiceOn ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: isVoiceOn ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {isVoiceOn ? <Volume2 size={16} color="#c084fc" /> : <VolumeX size={16} color="#94a3b8" />}
        </button>

        {/* Nút ➕ Zoom In */}
        <button
          onClick={() => {
            sceneRef.current?.zoom(-1.2);
            NativeBridge.hapticImpact('light');
          }}
          className="hud-icon-btn has-tooltip tooltip-left hide-on-mobile"
          data-tooltip={lang === 'en' ? 'Zoom in (Scroll up / Key W)' : 'Phóng to (Cuộn chuột lên / Phím W)'}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
          }}
        >
          <ZoomIn size={16} color="#cbd5e1" />
        </button>

        {/* Nút ➖ Zoom Out */}
        <button
          onClick={() => {
            sceneRef.current?.zoom(1.2);
            NativeBridge.hapticImpact('light');
          }}
          className="hud-icon-btn has-tooltip tooltip-left hide-on-mobile"
          data-tooltip={lang === 'en' ? 'Zoom out (Scroll down / Key S)' : 'Thu nhỏ (Cuộn chuột xuống / Phím S)'}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
          }}
        >
          <ZoomOut size={16} color="#cbd5e1" />
        </button>

        {/* Nút 🔄 Reset Camera */}
        <button
          onClick={() => {
            sceneRef.current?.resetCamera();
            NativeBridge.hapticImpact('light');
          }}
          className="hud-icon-btn has-tooltip tooltip-left"
          data-tooltip={lang === 'en' ? 'Reset Camera [Key R]' : 'Đặt lại góc nhìn [Phím R]'}
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
          }}
        >
          <RotateCcw size={16} color="#cbd5e1" />
        </button>

        {/* Nút ⛶ Toàn Màn Hình */}
        <button
          onClick={toggleFullscreen}
          className="hud-icon-btn has-tooltip tooltip-left"
          data-tooltip={
            isFullscreen
              ? (lang === 'en' ? 'Exit Fullscreen [Key F]' : 'Thu nhỏ cửa sổ [Phím F]')
              : (lang === 'en' ? 'Fullscreen [Key F]' : 'Toàn màn hình [Phím F]')
          }
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            borderRadius: '10px',
            background: isFullscreen ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
          }}
        >
          {isFullscreen ? <Minimize2 size={16} color="#818cf8" /> : <Maximize2 size={16} color="#cbd5e1" />}
        </button>
      </div>

      {/* === FLOATING SUBTITLE BANNER: LỜI XƯỚNG QUẢN TRÒ AI === */}
      {narratorSubtitle && (
        <div
          style={{
            position: 'absolute',
            top: isFullscreen ? '16px' : '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90vw',
            zIndex: 35,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(168, 85, 247, 0.25)',
              color: '#f8fafc',
            }}
          >
            {/* Sóng âm thanh nhấp nháy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc', flexShrink: 0 }}>
              <Volume2 size={18} />
              <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'flex-end', height: '14px' }}>
                <span style={{ width: '3px', height: '6px', background: '#c084fc', borderRadius: '1px' }} />
                <span style={{ width: '3px', height: '13px', background: '#e9d5ff', borderRadius: '1px' }} />
                <span style={{ width: '3px', height: '9px', background: '#c084fc', borderRadius: '1px' }} />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'en' ? '🎙️ AI Narrator' : '🎙️ Quản Trò AI'}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.3, whiteSpace: 'normal', maxWidth: '70vw' }}>
                {narratorSubtitle}
              </div>
            </div>

            <button
              onClick={() => narratorVoice.stop()}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0,
                marginLeft: '6px',
              }}
              title={lang === 'en' ? 'Stop' : 'Dừng'}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* === BANNER TRẠNG THÁI NỔI (CHỈ HIỂN THỊ TỐI ĐA 1 BANNER TRÊN ĐÁY DOCK: copyToast > lynchNotice > hoveredPlayer > isRoaming) === */}
      {copyToast ? (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.96) 0%, rgba(5, 150, 105, 0.96) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid #6ee7b7',
            borderRadius: '20px',
            padding: '10px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 800,
            zIndex: 100,
            boxShadow: '0 12px 32px rgba(5, 150, 105, 0.5), 0 4px 16px rgba(0,0,0,0.6)',
            animation: 'pulseBorder 2s infinite',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
          }}
        >
          <Check size={18} color="#ffffff" strokeWidth={3} />
          <span>{copyToast}</span>
        </div>
      ) : lynchNotice ? (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            border: '1px solid #f87171',
            borderRadius: '20px',
            padding: '8px 18px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 800,
            zIndex: 25,
            boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
          }}
        >
          {lynchNotice}
        </div>
      ) : hoveredPlayer && !selectedPlayer ? (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 29, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '20px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{hoveredPlayer.characterIcon || '🏕️'}</span>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
            #{hoveredPlayer.seatNumber}: {hoveredPlayer.name}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '10px',
              background: hoveredPlayer.isAlive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: hoveredPlayer.isAlive ? '#4ade80' : '#f87171',
              fontWeight: 700,
            }}
          >
            {hoveredPlayer.isAlive
              ? lang === 'en' ? 'Alive' : 'Còn Sống'
              : lang === 'en' ? 'Fallen' : 'Đã Hy Sinh'}
          </span>
        </div>
      ) : isRoaming ? (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 15, 29, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #38bdf8',
            borderRadius: '20px',
            padding: '6px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f8fafc',
            fontSize: '0.78rem',
            fontWeight: 700,
            pointerEvents: 'none',
            zIndex: 15,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
          }}
        >
          <span>
            {lang === 'en'
              ? '🚶 Roaming: Tap ground or press WASD to walk'
              : '🚶 Đang đi dạo: Chạm mặt đất hoặc nhấn WASD để di chuyển'}
          </span>
        </div>
      ) : null}

      {/* === THANH HÀNH ĐỘNG CHÍNH (CLEAN BOTTOM ACTION DOCK - TRẠNG THÁI BÌNH THƯỜNG) === */}
      {!isSimultaneousNight && !isDayDiscussion && (
        <div
          className="hud-pill-bar bottom-action-dock"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '18px',
            padding: '6px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            zIndex: 25,
            pointerEvents: 'auto',
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {/* Nút chính: Bắt Đầu Đêm Đồng Thời (25s) */}
          <button
            onClick={startSimultaneousNight}
            className="has-tooltip dock-start-night-btn"
            data-tooltip={
              lang === 'en'
                ? 'Start Simultaneous Night: All roles act together in 25s'
                : 'Bắt đầu Đêm Đồng Thời: Tất cả vai trò hành động cùng lúc trong 25 giây'
            }
            style={{
              height: '38px',
              minHeight: '38px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95) 0%, rgba(79, 70, 229, 0.95) 100%)',
              border: '1.5px solid rgba(192, 132, 252, 0.6)',
              borderRadius: '12px',
              padding: '0 16px',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(147, 51, 234, 0.5)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.16s ease',
            }}
          >
            <Moon size={16} color="#fef08a" />
            <span className="dock-start-night-text-desktop">
              {lang === 'en' ? 'Start Simultaneous Night (25s)' : 'Bắt Đầu Đêm Đồng Thời (25s)'}
            </span>
            <span className="dock-start-night-text-mobile">
              {lang === 'en' ? 'Bắt Đầu Đêm (25s)' : 'Bắt Đầu Đêm (25s)'}
            </span>
          </button>

          {/* Nút phụ: Đổi Ngoại Trang / Tủ Đồ */}
          <button
            onClick={() => {
              setIsWardrobeOpen(true);
              NativeBridge.hapticImpact('light');
            }}
            className="has-tooltip dock-wardrobe-btn"
            data-tooltip={lang === 'en' ? 'Open 3D Wardrobe & Character Studio' : 'Mở Tủ Đồ & Đổi Mẫu Nhân Vật 3D'}
            style={{
              height: '38px',
              minHeight: '38px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '0 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.16s ease',
            }}
          >
            <Palette size={15} color="#c084fc" />
            <span className="dock-wardrobe-text">{lang === 'en' ? '✨ Wardrobe' : '✨ Đổi Ngoại Trang'}</span>
          </button>
        </div>
      )}

      {/* === THANH KỸ NĂNG ĐÊM ĐỒNG THỜI (SIMULTANEOUS NIGHT ACTION DOCK) === */}
      {isSimultaneousNight && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 35,
            width: '95%',
            maxWidth: '680px',
            pointerEvents: 'none',
          }}
        >
          {/* Header Đếm Ngược + Trạng Thái Chiêu + Nút Tổng Hợp Ngay */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(10, 15, 29, 0.94)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${selectedSkill ? selectedSkill.color : '#a855f7'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: `0 4px 20px ${selectedSkill ? selectedSkill.color + '44' : 'rgba(168, 85, 247, 0.45)'}`,
              width: '100%',
              boxSizing: 'border-box',
              animation: 'pulseBorder 1.5s infinite',
            }}
          >
            {/* Countdown Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span style={{ fontSize: '1rem' }}>⏱️</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#facc15' }}>
                {nightCountdown}s
              </span>
            </div>

            {/* Hint / Target locked text */}
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#cbd5e1',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {lockedAction ? (
                <span style={{ color: '#4ade80', fontWeight: 800 }}>
                  <Check size={12} strokeWidth={3} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  {lang === 'en'
                    ? `Locked [${selectedSkill?.nameEn || 'Skill'}] ➔ Seat #${lockedAction.targetSeat}`
                    : `Đã khóa [${selectedSkill?.name || 'Chiêu'}] ➔ Ghế #${lockedAction.targetSeat}`}
                </span>
              ) : selectedSkill ? (
                <span style={{ color: selectedSkill.color, fontWeight: 800 }}>
                  {lang === 'en'
                    ? `[${selectedSkill.nameEn}]: Tap seat on 3D or below`
                    : `[${selectedSkill.name}]: Bấm ghế 3D hoặc số ghế bên dưới`}
                </span>
              ) : (
                <span>
                  {botLiveTicker || (lang === 'en' ? 'Select a skill to cast:' : 'Chọn 1 kỹ năng để thi triển:')}
                </span>
              )}
            </div>

            {/* Nút Tổng Hợp Ngay */}
            <button
              onClick={resolveSimultaneousNight}
              className="hud-btn has-tooltip tooltip-bottom"
              data-tooltip={lang === 'en' ? 'Resolve all actions immediately' : 'Tổng hợp ngay lập tức các hành động'}
              style={{
                height: '32px',
                minHeight: '32px',
                background: 'rgba(239, 68, 68, 0.3)',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                padding: '0 10px',
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#fca5a5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <Zap size={12} color="#f87171" />
              <span>{lang === 'en' ? '⚡ Resolve' : '⚡ Tổng Hợp'}</span>
            </button>
          </div>

          {/* Dải 10 Ghế Siêu Mảnh (26px) — Hỗ trợ touch mobile & keyboard */}
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              justifyContent: 'center',
              overflowX: 'auto',
              width: '100%',
              padding: '2px 0',
            }}
          >
            {seatsData.map((seat) => {
              const isLocked = lockedAction?.targetSeat === seat.seatNumber;
              const isSelected = selectedSeat === seat.seatNumber;
              return (
                <button
                  key={seat.seatNumber}
                  onClick={() => handleSeatInteraction(seat.seatNumber)}
                  disabled={!seat.isAlive}
                  className="has-tooltip tooltip-bottom"
                  data-tooltip={`#${seat.seatNumber} ${seat.name} (${seat.isAlive ? (lang === 'en' ? 'Alive' : 'Sống') : (lang === 'en' ? 'Dead' : 'Chết')})`}
                  style={{
                    width: '26px',
                    height: '26px',
                    minWidth: '26px',
                    minHeight: '26px',
                    borderRadius: '7px',
                    border: isLocked
                      ? `2px solid ${selectedSkill?.color || '#38bdf8'}`
                      : isSelected
                      ? '1.5px solid #818cf8'
                      : '1px solid rgba(255,255,255,0.12)',
                    background: isLocked
                      ? `${selectedSkill?.color || '#38bdf8'}44`
                      : seat.isAlive
                      ? 'rgba(15, 23, 42, 0.85)'
                      : 'rgba(51, 65, 85, 0.4)',
                    color: seat.isAlive ? '#f8fafc' : '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    cursor: seat.isAlive ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: isLocked
                      ? `0 0 10px ${selectedSkill?.color || '#38bdf8'}`
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>

          {/* 5 Kỹ Năng Đêm Đồng Thời trên 1 hàng duy nhất */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(10, 15, 30, 0.94)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(129, 140, 248, 0.35)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
              borderRadius: '18px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              width: '100%',
              boxSizing: 'border-box',
              overflowX: 'auto',
            }}
          >
            {NIGHT_COMBAT_SKILLS.map((skill) => {
              const isSelected = selectedSkill?.id === skill.id;
              return (
                <button
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill)}
                  className="has-tooltip"
                  data-tooltip={`[${skill.hotkey}] ${lang === 'en' ? skill.nameEn : skill.name} • ${lang === 'en' ? skill.actionTextEn : skill.actionText}`}
                  style={{
                    height: '42px',
                    minHeight: '42px',
                    background: isSelected
                      ? `linear-gradient(135deg, ${skill.color}40 0%, ${skill.color}75 100%)`
                      : 'rgba(22, 30, 49, 0.7)',
                    border: `1.5px solid ${isSelected ? skill.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected
                      ? `0 0 16px ${skill.color}66`
                      : 'none',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    flex: '1 1 auto',
                    justifyContent: 'center',
                    minWidth: '68px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Badge Hotkey */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '6px',
                      background: isSelected ? skill.color : 'rgba(15, 23, 42, 0.95)',
                      border: `1px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      borderRadius: '5px',
                      padding: '0 4px',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {skill.hotkey}
                  </div>

                  <span style={{ fontSize: '1.2rem' }}>{skill.icon}</span>

                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 900,
                        color: isSelected ? '#ffffff' : skill.color,
                        letterSpacing: '0.2px',
                        lineHeight: 1.1,
                      }}
                    >
                      {lang === 'en' ? skill.nameEn : skill.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* === MODAL BÌNH MINH KHU CẮM TRẠI: BÁO CÁO ĐÊM ĐỒNG THỜI === */}
      {dawnData && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 7, 16, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1.5px solid rgba(250, 204, 21, 0.5)',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 16px 48px rgba(0,0,0,0.9)',
              animation: 'pulseBorder 2s infinite',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.8rem' }}>🌅</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fef08a' }}>
                  {lang === 'en' ? '3D CAMP DAWN REPORT' : 'BÌNH MINH KHU CẮM TRẠI 3D'}
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  {lang === 'en'
                    ? 'Simultaneous Night Resolution Results'
                    : 'Kết quả giải quyết đồng thời của các vai trò đêm qua'}
                </div>
              </div>
            </div>

            {/* Danh sách sự kiện xảy ra */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '16px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#f8fafc',
              }}
            >
              {dawnData.eventLogs.length > 0 ? (
                dawnData.eventLogs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span>•</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div>
                  {lang === 'en'
                    ? 'The night passed peacefully, with no casualties.'
                    : 'Đêm qua trôi qua trong êm đềm, không ai bị sát hại.'}
                </div>
              )}
            </div>

            {/* Báo cáo Tiên Tri */}
            {dawnData.seerReport && (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid #06b6d4',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '0.8rem',
                  color: '#e0f2fe',
                }}
              >
                🔮 <b>{lang === 'en' ? 'Seer Revelation' : 'Nhãn Cầu Tiên Tri'}</b>:{' '}
                {lang === 'en' ? 'Identity of Seat' : 'Soi danh tính Ghế'} #{dawnData.seerReport.seatNumber} (
                {dawnData.seerReport.playerName}) ➔{' '}
                <span style={{ fontWeight: 900, color: dawnData.seerReport.isWolf ? '#ef4444' : '#4ade80' }}>
                  {dawnData.seerReport.roleFaction} {dawnData.seerReport.isWolf ? '🐺' : '👨‍🌾'}
                </span>
              </div>
            )}

            {/* Nút chuyển sang Pha Thảo Luận */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDawnData(null)}
                className="hud-btn"
                style={{
                  height: '38px',
                  minHeight: '38px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 18px',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                ☀️ {lang === 'en' ? 'Enter Day Discussion & Vote' : 'Vào Pha Thảo Luận & Vote Treo Cổ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === THANH ĐIỀU HÀNH PHA THẢO LUẬN & BIỂU QUYẾT TREO CỔ BAN NGÀY === */}
      {isDayDiscussion && !isSimultaneousNight && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(14px)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            zIndex: 25,
            maxWidth: '92%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} color="#facc15" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fef08a' }}>
                {lang === 'en' ? 'DAYTIME: DISCUSSION & TRIAL' : 'BAN NGÀY: THẢO LUẬN & BIỂU QUYẾT'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {lang === 'en'
                  ? 'Click on any living player to cast your lynching vote'
                  : 'Bấm vào ghế người chơi còn sống để bỏ phiếu treo cổ'}
              </div>
            </div>
          </div>

          <button
            onClick={executeLynching}
            className="hud-btn has-tooltip"
            data-tooltip={lang === 'en' ? 'Exile the player with the most votes' : 'Kết án treo cổ người chơi nhận nhiều phiếu bầu nhất'}
            style={{
              height: '34px',
              minHeight: '34px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: 'none',
              borderRadius: '10px',
              padding: '0 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            ⚖️ {lang === 'en' ? 'Execute Vote' : 'Kết Án Treo Cổ'}
          </button>

          <button
            onClick={startSimultaneousNight}
            className="hud-btn has-tooltip"
            data-tooltip={lang === 'en' ? 'Proceed to next night' : 'Bắt đầu đêm tiếp theo'}
            style={{
              height: '34px',
              minHeight: '34px',
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid #818cf8',
              borderRadius: '10px',
              padding: '0 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#c7d2fe',
              cursor: 'pointer',
            }}
          >
            🌙 {lang === 'en' ? 'Next Night' : 'Đêm Tiếp Theo'}
          </button>
        </div>
      )}

      {/* Thông tin ghế được chọn (Selected Player Card) */}
      {selectedPlayer && !isSimultaneousNight && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(129, 140, 248, 0.4)',
            borderRadius: '18px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            zIndex: 15,
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: selectedPlayer.isAlive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1.5px solid ${selectedPlayer.isAlive ? '#818cf8' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
            }}
          >
            {selectedPlayer.characterIcon || '🏕️'}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>
              #{selectedPlayer.seatNumber} {selectedPlayer.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: selectedPlayer.isAlive ? '#4ade80' : '#f87171' }}>
              {selectedPlayer.isAlive
                ? lang === 'en' ? '🟢 Alive' : '🟢 Còn Sống'
                : lang === 'en'
                ? `💀 Fallen (${selectedPlayer.deathReason || 'Eliminated'})`
                : `💀 Đã Hy Sinh (${selectedPlayer.deathReason || 'Bị sát hại'})`}
              {votes[selectedPlayer.seatNumber]
                ? ` • 🗳️ ${votes[selectedPlayer.seatNumber]} ${lang === 'en' ? 'votes' : 'phiếu'}`
                : ''}
            </div>
          </div>
          <button
            onClick={() => setSelectedSeat(null)}
            className="hud-icon-btn"
            style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', fontSize: '0.72rem', color: '#94a3b8', borderRadius: '6px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Wardrobe Modal */}
      <Wardrobe3DModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        initialOutfit={myOutfit}
        onSaveOutfit={(savedOutfit) => {
          setMyOutfit(savedOutfit);
          // Cập nhật tên nếu có
          const savedName = localStorage.getItem('ma_soi_player_name');
          if (savedName) setPlayerName(savedName);
          const savedCoins = localStorage.getItem('ma_soi_player_coins');
          if (savedCoins) setCoins(Number(savedCoins));
          NativeBridge.hapticNotification('success');
        }}
      />
    </div>
  );
};
