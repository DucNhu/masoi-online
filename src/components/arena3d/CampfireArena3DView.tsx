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
  Globe,
  Coins,
  Palette,
  Share2,
  Check,
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
      handleSeatInteraction(seatNumber);
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
      setLynchNotice(
        lang === 'en'
          ? `⚖️ The Village voted to exile Seat #${topSeat} (${victim?.name})!`
          : `⚖️ Dân làng đã biểu quyết treo cổ Ghế #${topSeat} (${victim?.name})!`
      );
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
  }, [isSimultaneousNight, selectedSkill, isNightMode, isFullscreen]);

  const toggleNightDay = () => {
    setIsNightMode((prev) => {
      const nextState = !prev;
      if (sceneRef.current) {
        sceneRef.current.setPhase(nextState);
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
        @keyframes pulseBorder {
          0%, 100% { box-shadow: 0 0 12px rgba(129, 140, 248, 0.4); }
          50% { box-shadow: 0 0 24px rgba(168, 85, 247, 0.8); }
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

      {/* === THANH HUD TRÊN CÙNG (TOP HUD TOOLBAR - BỐ CỤC 3D GAME PORTAL) === */}
      <div
        style={{
          position: 'absolute',
          top: isFullscreen ? '14px' : '76px',
          left: '14px',
          right: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 20,
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Góc Trái Trên: Sảnh 4 Túp Lều Cắm Trại + Mời Bạn Vào Lều + Đi Dạo WASD */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'auto',
            maxWidth: '100%',
          }}
        >
          {/* Bảng Sảnh 4 Túp Lều Cắm Trại */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(10, 15, 29, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              padding: '5px 8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              overflowX: 'auto',
              maxWidth: 'calc(100vw - 28px)',
            }}
          >
            {/* Label Sảnh 4 Túp Lều */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 6px',
                marginRight: '2px',
                flexShrink: 0,
              }}
            >
              <Tent size={16} color="#f59e0b" />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  color: '#fef08a',
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'en' ? 'Camp Tents' : 'Sảnh Lều'}
              </span>
            </div>

            {/* 4 Nút Túp Lều: Trăng Máu, Sương Mù, Rừng Thông, Đom Đóm */}
            {CAMP_TENTS.map((tent) => {
              const isActive = tent.id === activeTentId;
              return (
                <button
                  key={tent.id}
                  onClick={() => handleTentSelect(tent.id)}
                  className="btn btn-ghost has-tooltip tooltip-bottom"
                  data-tooltip={`${lang === 'en' ? tent.nameEn : tent.name} (${tent.playerCount}/${tent.maxPlayers}) • ${
                    lang === 'en' ? tent.taglineEn : tent.tagline
                  }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${tent.themeColor}38 0%, ${tent.themeColor}75 100%)`
                      : 'rgba(30, 41, 59, 0.65)',
                    border: `1.5px solid ${isActive ? tent.themeColor : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '6px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    color: '#f8fafc',
                    flexShrink: 0,
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? `0 0 16px ${tent.themeColor}77, inset 0 1px 0 rgba(255,255,255,0.3)` : 'none',
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 900 }}>{tent.banner}</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0,0,0,0.4)' : 'rgba(15, 23, 42, 0.6)',
                      color: isActive ? '#ffffff' : tent.themeColor,
                      border: `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                    }}
                  >
                    {tent.playerCount}/{tent.maxPlayers}
                  </span>
                </button>
              );
            })}

            {/* Vạch ngăn cách */}
            <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)', margin: '0 2px', flexShrink: 0 }} />

            {/* Nút 🔗 Mời Bạn Vào Lều (Share / Copy Tent Link) */}
            <button
              onClick={handleShareTentLink}
              className="btn btn-ghost has-tooltip tooltip-bottom"
              data-tooltip={
                lang === 'en'
                  ? `Copy invite link for ${currentTent.nameEn} (?tent=${activeTentId})`
                  : `Sao chép link mời bạn bè vào ${currentTent.name} (?tent=${activeTentId})`
              }
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                borderRadius: '12px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(56, 189, 248, 0.4)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Share2 size={13} color="#ffffff" />
              <span>{lang === 'en' ? '🔗 Invite to Tent' : '🔗 Mời Bạn Vào Lều'}</span>
            </button>
          </div>

          {/* Dòng Dưới: Đi Dạo WASD & Profile Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Nút Đứng Lên Đi Dạo (WASD) */}
            <button
              onClick={toggleRoamMode}
              className="btn btn-ghost has-tooltip tooltip-bottom"
              data-tooltip={
                isRoaming
                  ? lang === 'en' ? 'Sit back by the campfire' : 'Ngồi xuống quanh đống lửa'
                  : lang === 'en' ? 'Stand up & walk around camp freely (WASD)' : 'Đứng dậy đi bộ khám phá toàn khu cắm trại (WASD)'
              }
              style={{
                background: isRoaming
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(10, 15, 29, 0.90)',
                border: `1.5px solid ${isRoaming ? '#34d399' : 'rgba(255, 255, 255, 0.16)'}`,
                borderRadius: '14px',
                padding: '6px 13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#f8fafc',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: isRoaming ? '0 0 16px rgba(16, 185, 129, 0.5)' : '0 4px 14px rgba(0,0,0,0.5)',
              }}
            >
              <Footprints size={15} color={isRoaming ? '#ffffff' : '#38bdf8'} />
              <span>
                {isRoaming
                  ? lang === 'en' ? '🪑 Sit Down' : '🪑 Ngồi Vào Lều'
                  : lang === 'en' ? '🚶 Walk Around (WASD)' : '🚶 Đứng Lên Đi Dạo (WASD)'}
              </span>
            </button>

            {/* Badge Tên Nhân Vật & Số Dư Coin */}
            <div
              onClick={() => setIsWardrobeOpen(true)}
              className="has-tooltip tooltip-bottom"
              data-tooltip={lang === 'en' ? 'Click to open 3D Wardrobe' : 'Bấm để mở Phòng Thay Đồ 3D'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(10, 15, 29, 0.90)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(129, 140, 248, 0.35)',
                borderRadius: '14px',
                padding: '5px 12px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>
                {OUTFIT_SKINS.find((s) => s.id === myOutfit.skinId)?.icon || '🏕️'}
              </span>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc' }}>
                {playerName}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'rgba(250, 204, 21, 0.18)',
                  borderRadius: '8px',
                  padding: '2px 6px',
                  marginLeft: '2px',
                  color: '#fef08a',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                <Coins size={11} color="#facc15" />
                <span>{coins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Góc Phải Trên: Công cụ điều khiển 3D + Đêm Đồng Thời + Thử Mẫu + Tủ Đồ + Phím tắt */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {/* Nút Bắt Đầu Đêm Đồng Thời (25s) hoặc Ticker đếm ngược */}
          {!isSimultaneousNight ? (
            <button
              onClick={startSimultaneousNight}
              className="btn btn-ghost has-tooltip tooltip-bottom"
              data-tooltip={
                lang === 'en'
                  ? 'Start Simultaneous Night: All roles act together in 25s'
                  : 'Bắt đầu Đêm Đồng Thời: Tất cả vai trò hành động cùng lúc trong 25 giây'
              }
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)',
                border: '1.5px solid rgba(192, 132, 252, 0.5)',
                borderRadius: '14px',
                padding: '7px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 18px rgba(147, 51, 234, 0.45)',
                cursor: 'pointer',
              }}
            >
              <Moon size={15} color="#fef08a" />
              <span>{lang === 'en' ? '🌙 Night Phase (25s)' : '🌙 Đêm Đồng Thời (25s)'}</span>
            </button>
          ) : (
            <div
              style={{
                background: 'rgba(10, 15, 29, 0.94)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid #a855f7',
                borderRadius: '16px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                animation: 'pulseBorder 1.5s infinite',
                boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.85rem' }}>⏱️</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#facc15' }}>
                  {nightCountdown}s
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {botLiveTicker || (lang === 'en' ? 'Acting in parallel...' : 'Hành động song song...')}
              </div>
              <button
                onClick={resolveSimultaneousNight}
                className="btn btn-ghost has-tooltip tooltip-bottom"
                data-tooltip={lang === 'en' ? 'Resolve all actions immediately' : 'Tổng hợp ngay lập tức các hành động mà không cần chờ hết 25s'}
                style={{
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  borderRadius: '9px',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                <Zap size={11} color="#f87171" />
                <span>{lang === 'en' ? 'Resolve' : 'Tổng Hợp'}</span>
              </button>
            </div>
          )}

          {/* Nút Thử Mẫu Nhân Vật */}
          <button
            onClick={() => setIsWardrobeOpen(true)}
            className="btn btn-ghost has-tooltip tooltip-bottom"
            data-tooltip={lang === 'en' ? 'Try different character models & outfits' : 'Thử các mẫu nhân vật & trang phục khác nhau'}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: '1px solid #34d399',
              borderRadius: '14px',
              padding: '7px 12px',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Palette size={14} color="#ffffff" />
            <span>{lang === 'en' ? '🎭 Try Models' : '🎭 Thử Mẫu'}</span>
          </button>

          {/* Nút Tủ Đồ 3D */}
          <button
            onClick={() => {
              setIsWardrobeOpen(true);
              NativeBridge.hapticImpact('medium');
            }}
            className="btn btn-ghost has-tooltip tooltip-bottom"
            data-tooltip={lang === 'en' ? '3D Camp Wardrobe Studio' : 'Tủ Đồ & Tùy biến nhân vật 3D'}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(168, 85, 247, 0.35) 100%)',
              border: '1px solid rgba(165, 180, 252, 0.4)',
              borderRadius: '14px',
              padding: '7px 12px',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} color="#a5b4fc" />
            <span>{lang === 'en' ? '✨ Wardrobe' : '✨ Tủ Đồ 3D'}</span>
          </button>

          {/* Cụm công cụ Zoom, Reset [R], Fullscreen [F], Đổi Ngày/Đêm [N], Đổi Ngôn Ngữ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(10, 15, 29, 0.90)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '14px',
              padding: '2px 4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              gap: '2px',
            }}
          >
            {/* Zoom In */}
            <button
              onClick={() => {
                sceneRef.current?.zoom(-1.2);
                NativeBridge.hapticImpact('light');
              }}
              className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
              data-tooltip={lang === 'en' ? 'Zoom in (Scroll up / Key W)' : 'Phóng to góc nhìn (Cuộn chuột lên / Phím W)'}
              style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0 }}
            >
              <ZoomIn size={15} color="#cbd5e1" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={() => {
                sceneRef.current?.zoom(1.2);
                NativeBridge.hapticImpact('light');
              }}
              className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
              data-tooltip={lang === 'en' ? 'Zoom out (Scroll down / Key S)' : 'Thu nhỏ góc nhìn (Cuộn chuột xuống / Phím S)'}
              style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0 }}
            >
              <ZoomOut size={15} color="#cbd5e1" />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Reset View [R] */}
            <button
              onClick={() => {
                sceneRef.current?.resetCamera();
                NativeBridge.hapticImpact('light');
              }}
              className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
              data-tooltip={lang === 'en' ? 'Reset Camera [Key R]' : 'Đặt lại góc nhìn camera [Phím R]'}
              style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0 }}
            >
              <RotateCcw size={15} color="#cbd5e1" />
            </button>

            {/* Fullscreen [F] */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
              data-tooltip={
                isFullscreen
                  ? lang === 'en' ? 'Exit Fullscreen' : 'Thu nhỏ cửa sổ'
                  : lang === 'en' ? 'Fullscreen PC [Key F]' : 'Toàn màn hình máy tính [Phím F]'
              }
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                padding: 0,
                background: isFullscreen ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
              }}
            >
              {isFullscreen ? <Minimize2 size={15} color="#818cf8" /> : <Maximize2 size={15} color="#cbd5e1" />}
            </button>

            {/* Day / Night [N] */}
            <button
              onClick={toggleNightDay}
              className="btn btn-ghost btn-icon-only has-tooltip tooltip-bottom"
              data-tooltip={
                isNightMode
                  ? lang === 'en' ? 'Switch to Daytime [Key N]' : 'Chuyển sang Ban Ngày [Phím N]'
                  : lang === 'en' ? 'Switch to Nighttime [Key N]' : 'Chuyển sang Ban Đêm [Phím N]'
              }
              style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0 }}
            >
              {isNightMode ? <Sun size={15} color="#facc15" /> : <Moon size={15} color="#a5b4fc" />}
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />

            {/* Nút Chuyển Đổi Ngôn Ngữ VI / EN */}
            <button
              onClick={toggleLang}
              className="btn btn-ghost has-tooltip tooltip-bottom"
              data-tooltip={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              style={{
                padding: '3px 8px',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Globe size={13} color="#38bdf8" />
              <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thông Báo Sao Chép Link Túp Lều Thành Công */}
      {copyToast && (
        <div
          style={{
            position: 'absolute',
            top: isFullscreen ? '72px' : '136px',
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
      )}

      {/* Thông Báo Đi Dạo */}
      {isRoaming && (
        <div
          style={{
            position: 'absolute',
            top: isFullscreen ? '72px' : '136px',
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
          }}
        >
          <span>
            {lang === 'en'
              ? '🎮 Free Roam Mode: Use W / A / S / D or Arrow Keys to walk around camp.'
              : '🎮 Đang đi dạo tự do: Dùng phím W / A / S / D hoặc Phím Mũi Tên để di chuyển.'}
          </span>
        </div>
      )}

      {/* Thông Báo Treo Cổ Ban Ngày */}
      {lynchNotice && (
        <div
          style={{
            position: 'absolute',
            top: isFullscreen ? '72px' : '136px',
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
          }}
        >
          {lynchNotice}
        </div>
      )}

      {/* Desktop Hover Tooltip Người Chơi Trên Ghế */}
      {hoveredPlayer && !selectedPlayer && (
        <div
          style={{
            position: 'absolute',
            top: isFullscreen ? '72px' : '136px',
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
      )}

      {/* === THANH KỸ NĂNG ĐÊM ĐỒNG THỜI (POKÉMON-COMBAT STYLE SKILL DOCK) === */}
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
            width: '92%',
            maxWidth: '780px',
            pointerEvents: 'none',
          }}
        >
          {/* Hướng dẫn nhắm mục tiêu & Thông tin chiêu thức */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(10, 15, 29, 0.94)',
              backdropFilter: 'blur(16px)',
              border: `1.5px solid ${selectedSkill ? selectedSkill.color : '#818cf8'}`,
              borderRadius: '20px',
              padding: '6px 18px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: `0 4px 20px ${selectedSkill ? selectedSkill.color + '44' : 'rgba(0,0,0,0.6)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1rem' }}>⚔️</span>
            <span>
              {selectedSkill
                ? lang === 'en'
                  ? `Active [${selectedSkill.nameEn}]: Click on 3D seat or seat # below to ${selectedSkill.actionTextEn}`
                  : `Đang dùng [${selectedSkill.name}]: Nhấp vào ghế 3D hoặc số ghế bên dưới để ${selectedSkill.actionText}`
                : lang === 'en'
                ? 'Choose a night skill to cast in simultaneous phase:'
                : 'Hãy chọn 1 kỹ năng để thi triển trong đêm đồng thời:'}
            </span>
            {lockedAction && (
              <span
                style={{
                  background: 'rgba(74, 222, 128, 0.2)',
                  color: '#4ade80',
                  border: '1px solid #4ade80',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  marginLeft: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} strokeWidth={3} />
                {lang === 'en' ? `Target Locked: Seat #${lockedAction.targetSeat}` : `Đã Khóa: Ghế #${lockedAction.targetSeat}`}
              </span>
            )}
          </div>

          {/* Bàn Dock Kính Mờ: Ghế Mục Tiêu 1-10 + 5 Chiêu Thức Q, W, E, R, T */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(10, 15, 30, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(129, 140, 248, 0.4)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              borderRadius: '22px',
              padding: '10px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Hàng 1: Dải 10 Ghế Mục Tiêu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                justifyContent: 'center',
                overflowX: 'auto',
                paddingBottom: '2px',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginRight: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? 'Target Seat:' : 'Mục Tiêu Ghế:'}
              </span>
              {seatsData.map((seat) => {
                const isLocked = lockedAction?.targetSeat === seat.seatNumber;
                const isSelected = selectedSeat === seat.seatNumber;
                return (
                  <button
                    key={seat.seatNumber}
                    onClick={() => handleSeatInteraction(seat.seatNumber)}
                    disabled={!seat.isAlive}
                    className="has-tooltip tooltip-bottom"
                    data-tooltip={`#${seat.seatNumber} ${seat.name} - ${
                      seat.isAlive ? (lang === 'en' ? 'Alive' : 'Còn sống') : (lang === 'en' ? 'Fallen' : 'Đã hy sinh')
                    }`}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      border: isLocked
                        ? `2px solid ${selectedSkill?.color || '#38bdf8'}`
                        : isSelected
                        ? '2px solid #818cf8'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: isLocked
                        ? `${selectedSkill?.color || '#38bdf8'}33`
                        : seat.isAlive
                        ? 'rgba(30, 41, 59, 0.85)'
                        : 'rgba(100, 116, 139, 0.25)',
                      color: seat.isAlive ? '#f8fafc' : '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: seat.isAlive ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isLocked
                        ? `0 0 14px ${selectedSkill?.color || '#38bdf8'}88`
                        : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {seat.seatNumber}
                    {isLocked && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: selectedSkill?.color || '#38bdf8',
                          border: '1.5px solid #0f172a',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)' }} />

            {/* Hàng 2: Dải 5 Kỹ Năng Đêm Đồng Thời Kiểu Pokémon / Liên Minh */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                justifyContent: 'center',
                width: '100%',
                overflowX: 'auto',
                padding: '2px 0',
              }}
            >
              {NIGHT_COMBAT_SKILLS.map((skill) => {
                const isSelected = selectedSkill?.id === skill.id;
                return (
                  <button
                    key={skill.id}
                    onClick={() => handleSelectSkill(skill)}
                    className="btn btn-ghost has-tooltip"
                    data-tooltip={`[${skill.hotkey}] ${lang === 'en' ? skill.descriptionEn : skill.description}`}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${skill.color}40 0%, ${skill.color}75 100%)`
                        : 'rgba(22, 30, 49, 0.75)',
                      border: `1.5px solid ${isSelected ? skill.color : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: '16px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected
                        ? `0 0 20px ${skill.color}66, inset 0 1px 0 rgba(255,255,255,0.3)`
                        : 'none',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                    }}
                  >
                    {/* Badge Hotkey Góc Phím Q, W, E, R, T */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-7px',
                        left: '10px',
                        background: isSelected ? skill.color : 'rgba(15, 23, 42, 0.95)',
                        border: `1px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        borderRadius: '6px',
                        padding: '1px 5px',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      }}
                    >
                      {skill.hotkey}
                    </div>

                    <span style={{ fontSize: '1.35rem', marginTop: '2px' }}>{skill.icon}</span>

                    <div style={{ textAlign: 'left' }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          color: isSelected ? '#ffffff' : skill.color,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {lang === 'en' ? skill.nameEn : skill.name}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#cbd5e1' }}>
                        {lang === 'en' ? skill.actionTextEn : skill.actionText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '10px 20px',
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
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
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
            className="btn btn-ghost has-tooltip"
            data-tooltip={lang === 'en' ? 'Exile the player with the most votes' : 'Kết án treo cổ người chơi nhận nhiều phiếu bầu nhất'}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 14px',
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
            className="btn btn-ghost has-tooltip"
            data-tooltip={lang === 'en' ? 'Proceed to next night' : 'Bắt đầu đêm tiếp theo'}
            style={{
              background: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid #818cf8',
              borderRadius: '12px',
              padding: '6px 14px',
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
            bottom: isDayDiscussion ? '72px' : '16px',
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
            className="btn btn-ghost"
            style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '4px 8px' }}
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
