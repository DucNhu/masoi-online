import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WolfCharacter } from './WolfMeshBuilder';
import {
  PlayerOutfitConfig,
  DEFAULT_OUTFIT,
  DEFAULT_PLAYER_COINS,
  DEFAULT_UNLOCKED_ITEMS,
  OUTFIT_SKINS,
  OUTFIT_HATS,
  OUTFIT_EYES,
  OUTFIT_BACK_ITEMS,
  WolfSkinId,
  WolfHatId,
  WolfEyeGlowId,
  WolfBackItemId,
} from './types';
import { NativeBridge } from '../../utils/nativeBridge';
import {
  Sparkles,
  RotateCw,
  Check,
  X,
  Coins,
  PlusCircle,
  Globe,
  User,
  ShoppingBag,
} from 'lucide-react';

interface Wardrobe3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOutfit: (outfit: PlayerOutfitConfig) => void;
  initialOutfit?: PlayerOutfitConfig;
}

export const Wardrobe3DModal: React.FC<Wardrobe3DModalProps> = ({
  isOpen,
  onClose,
  onSaveOutfit,
  initialOutfit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const characterRef = useRef<WolfCharacter | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Ngôn ngữ VI / EN
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    try {
      return (localStorage.getItem('ma_soi_lang') as 'vi' | 'en') || 'vi';
    } catch {
      return 'vi';
    }
  });

  // Tên nhân vật của người chơi
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_name');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return lang === 'en' ? 'Night Camper' : 'Thợ Săn Đêm';
  });

  // Hệ thống Coins (Mặc định 1,500 Coin)
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_coins');
      if (saved) return Number(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PLAYER_COINS;
  });

  // Danh sách vật phẩm đã mở khóa
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_unlocked_items');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_UNLOCKED_ITEMS;
  });

  const [outfit, setOutfit] = useState<PlayerOutfitConfig>(() => {
    if (initialOutfit) return initialOutfit;
    try {
      const saved = localStorage.getItem('ma_soi_player_outfit');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OUTFIT;
  });

  const [activeCategory, setActiveCategory] = useState<'SKIN' | 'HAT' | 'EYE' | 'BACK'>('SKIN');
  const [currentEmote, setCurrentEmote] = useState<'idle' | 'walk' | 'howl' | 'point' | 'slumber'>('idle');
  const [shopNotice, setShopNotice] = useState<string | null>(null);

  // Lắng nghe đổi ngôn ngữ từ cửa sổ chính
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

  // Nạp thêm Coin để test
  const handleAddCoins = () => {
    const nextCoins = coins + 500;
    setCoins(nextCoins);
    try {
      localStorage.setItem('ma_soi_player_coins', String(nextCoins));
    } catch {
      // ignore
    }
    setShopNotice(lang === 'en' ? '🎉 +500 Coins claimed for testing!' : '🎉 Đã nhận thêm +500 Coin thử nghiệm!');
    NativeBridge.hapticNotification('success');
    setTimeout(() => setShopNotice(null), 3000);
  };

  // Mua vật phẩm
  const handleBuyItem = (itemId: string, price: number, itemName: string) => {
    if (coins < price) {
      setShopNotice(
        lang === 'en'
          ? `⚠️ Not enough Coins! Need ${price - coins} more. Click "+ 500 Coins" to claim.`
          : `⚠️ Không đủ Coin! Thiếu ${price - coins} Coin nữa. Bấm nút "+ Nạp 500 Coin" để nhận thêm.`
      );
      NativeBridge.hapticNotification('warning');
      setTimeout(() => setShopNotice(null), 4000);
      return;
    }

    const nextCoins = coins - price;
    const nextUnlocked = Array.from(new Set([...unlockedItems, itemId]));
    setCoins(nextCoins);
    setUnlockedItems(nextUnlocked);

    try {
      localStorage.setItem('ma_soi_player_coins', String(nextCoins));
      localStorage.setItem('ma_soi_unlocked_items', JSON.stringify(nextUnlocked));
    } catch {
      // ignore
    }

    setShopNotice(
      lang === 'en'
        ? `✅ Unlocked [${itemName}] for ${price} Coins!`
        : `✅ Đã mở khóa thành công [${itemName}] với giá ${price} Coin!`
    );
    NativeBridge.hapticNotification('success');
    setTimeout(() => setShopNotice(null), 3000);
  };

  // Thử Combo Nhanh (Preset Combos)
  const PRESET_COMBOS = [
    {
      name: lang === 'en' ? '🏕️ Explorer' : '🏕️ Phượt Thủ',
      outfit: { skinId: 'WOLF_GRAY', hatId: 'CONICAL_HAT', eyeGlowId: 'RED', backItemId: 'NONE' },
    },
    {
      name: lang === 'en' ? '🔮 Seer' : '🔮 Tiên Tri',
      outfit: { skinId: 'WOLF_SNOW', hatId: 'WITCH', eyeGlowId: 'CYAN', backItemId: 'CAPE' },
    },
    {
      name: lang === 'en' ? '🏹 Hunter' : '🏹 Thợ Săn',
      outfit: { skinId: 'WOLF_GOLD', hatId: 'COWBOY', eyeGlowId: 'YELLOW', backItemId: 'SWORD' },
    },
    {
      name: lang === 'en' ? '🧪 Witch' : '🧪 Phù Thủy',
      outfit: { skinId: 'WOLF_SHADOW', hatId: 'WITCH', eyeGlowId: 'PURPLE', backItemId: 'POTION' },
    },
    {
      name: lang === 'en' ? '🌸 Student' : '🌸 Nữ Sinh',
      outfit: { skinId: 'CAMPER_GIRL', hatId: 'BANDANA', eyeGlowId: 'CYAN', backItemId: 'POTION' },
    },
    {
      name: lang === 'en' ? '🦊 Kitsune' : '🦊 Hồ Ly',
      outfit: { skinId: 'KITSUNE_FOX', hatId: 'CROWN', eyeGlowId: 'YELLOW', backItemId: 'SHIELD' },
    },
    {
      name: lang === 'en' ? '🐺 Werewolf' : '🐺 Sói Nguyệt',
      outfit: { skinId: 'WOLF_BLOOD', hatId: 'NONE', eyeGlowId: 'RED', backItemId: 'CAPE' },
    },
  ];

  const applyPresetCombo = (presetOutfit: any) => {
    setOutfit(presetOutfit);
    if (characterRef.current) {
      characterRef.current.updateOutfit(presetOutfit);
    }
    NativeBridge.hapticImpact('medium');
  };

  // Khởi tạo Three.js preview scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c16);

    const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
    camera.position.set(0, 1.25, 4.0);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Ánh sáng Studio ấm áp phong cách Cắm Trại Đêm
    const ambientLight = new THREE.AmbientLight(0xfff1f2, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xa5b4fc, 2.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const warmFillLight = new THREE.DirectionalLight(0xfacc15, 1.4);
    warmFillLight.position.set(-3, 2, 2);
    scene.add(warmFillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Bục đứng gỗ cắm trại cao cấp (Wooden Campfire Deck Pedestal)
    const pedestalGroup = new THREE.Group();
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.15,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.25, 32), pedestalMat);
    pedestal.position.y = -0.125;
    pedestal.receiveShadow = true;
    pedestalGroup.add(pedestal);

    // Viền sáng Neon màu Cyan quanh bục
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.24, 1.29, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    pedestalGroup.add(ring);

    scene.add(pedestalGroup);

    // Nhân vật 3D
    const character = new WolfCharacter(outfit);
    character.setStanding(true);
    character.root.position.y = 0;
    character.setNameplate(playerName, 1, true);
    scene.add(character.root);
    characterRef.current = character;

    // Xoay nhân vật bằng chuột / cảm ứng
    let isDragging = false;
    let prevX = 0;

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      prevX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !characterRef.current) return;
      const curX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const dx = curX - prevX;
      characterRef.current.root.rotation.y += dx * 0.015;
      prevX = curX;
    };
    const onUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(2.0, Math.min(6.0, camera.position.z + e.deltaY * 0.005));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (characterRef.current) {
        characterRef.current.update(delta);
        if (!isDragging) {
          characterRef.current.root.rotation.y += delta * 0.35;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      renderer.dispose();
    };
  }, [isOpen]);

  // Cập nhật khi outfit thay đổi
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.updateOutfit(outfit);
    }
  }, [outfit]);

  // Cập nhật tên nhân vật
  const handleNameChange = (newName: string) => {
    setPlayerName(newName);
    try {
      localStorage.setItem('ma_soi_player_name', newName);
    } catch {
      // ignore
    }
    if (characterRef.current) {
      characterRef.current.setNameplate(newName, 1, true);
    }
  };

  const handleEmote = (emote: 'idle' | 'walk' | 'howl' | 'point' | 'slumber') => {
    setCurrentEmote(emote);
    if (characterRef.current) {
      if (emote === 'walk' || emote === 'idle') {
        characterRef.current.setStanding(true);
      } else {
        characterRef.current.setStanding(false);
      }
      characterRef.current.setAnimation(emote);
    }
    NativeBridge.hapticImpact('light');
  };

  const handleSave = () => {
    NativeBridge.hapticNotification('success');
    try {
      localStorage.setItem('ma_soi_player_outfit', JSON.stringify(outfit));
      localStorage.setItem('ma_soi_player_name', playerName);
    } catch {
      // ignore
    }
    onSaveOutfit(outfit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.25s ease-out',
        fontFamily: "'Montserrat', 'Be Vietnam Pro', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        className="wardrobe-modal-shell modal-fixed-shell"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '94vh',
          backgroundColor: '#0d101d',
          borderRadius: '24px',
          border: '1.5px solid rgba(129, 140, 248, 0.35)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 35px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với Tiêu đề, Số dư Coin, Nút Nạp Coin và Chuyển Ngôn ngữ */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.5) 0%, transparent 100%)',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏕️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>
                {lang === 'en' ? '🏕️ 3D Camp Wardrobe Studio' : '🏕️ Phòng Thay Đồ Cắm Trại 3D'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'en'
                  ? 'Customize Characters, Outfits & Camp Accessories'
                  : 'Tùy biến Nhân Vật, Trang Phục & Phụ Kiện Đêm Trại'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Badge Số Dư Coin */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(250, 204, 21, 0.15)',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                borderRadius: '16px',
                padding: '4px 10px',
                color: '#fef08a',
                fontSize: '0.8rem',
                fontWeight: 800,
              }}
            >
              <Coins size={14} color="#facc15" />
              <span>{coins.toLocaleString()} 🪙</span>
            </div>

            {/* Nút + 500 Coin Nhanh */}
            <button
              onClick={handleAddCoins}
              className="btn btn-ghost"
              title={lang === 'en' ? 'Claim 500 Coins for testing' : 'Nhận thêm 500 Coin thử nghiệm'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.3) 100%)',
                border: '1px solid #eab308',
                borderRadius: '14px',
                padding: '5px 10px',
                color: '#fef08a',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={14} color="#fef08a" />
              <span>{lang === 'en' ? '+500 Coins' : '+ Nạp 500'}</span>
            </button>

            {/* Nút Chuyển Đổi Ngôn Ngữ VI / EN */}
            <button
              onClick={toggleLang}
              className="btn btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '5px 8px',
                color: '#f8fafc',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Globe size={13} color="#38bdf8" />
              <span>{lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon-only"
              style={{ width: '32px', height: '32px', padding: 0 }}
            >
              <X size={18} color="#94a3b8" />
            </button>
          </div>
        </div>

        {/* Thanh Thông Báo Mua Sắm / Nạp Coin */}
        {shopNotice && (
          <div
            style={{
              padding: '6px 16px',
              backgroundColor: 'rgba(99, 102, 241, 0.25)',
              borderBottom: '1px solid rgba(129, 140, 248, 0.3)',
              color: '#c7d2fe',
              fontSize: '0.78rem',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {shopNotice}
          </div>
        )}

        {/* Thanh Dải Combo Mẫu Thử Nhanh (Preset Quick Preview Bar) */}
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', whiteSpace: 'nowrap' }}>
            {lang === 'en' ? '🎭 Try Presets:' : '🎭 Thử Mẫu Nhanh:'}
          </span>
          {PRESET_COMBOS.map((combo, idx) => (
            <button
              key={idx}
              onClick={() => applyPresetCombo(combo.outfit)}
              style={{
                background: outfit.skinId === combo.outfit.skinId ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.6)',
                border: `1px solid ${outfit.skinId === combo.outfit.skinId ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#f8fafc',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {combo.name}
            </button>
          ))}
        </div>

        {/* Responsive Body Grid (Desktop: 2 columns, Mobile: 1 column) */}
        <div className="wardrobe-body-grid" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* 3D Viewport Box */}
          <div
            className="wardrobe-canvas-container"
            style={{
              position: 'relative',
              flex: 1.1,
              minHeight: '260px',
              background: 'radial-gradient(circle at center, #171a33 0%, #070810 100%)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

            {/* Badge Tên Nhân Vật & Ghế Đang Thử */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #38bdf8',
                borderRadius: '16px',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              <User size={13} color="#38bdf8" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                {playerName || (lang === 'en' ? 'Night Camper' : 'Thợ Săn Đêm')}
              </span>
            </div>

            {/* Hint drag rotate */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: 'none',
              }}
            >
              <RotateCw size={12} /> {lang === 'en' ? 'Drag to rotate 360°' : 'Vuốt để xoay 360°'}
            </div>

            {/* Emote Quick Test Buttons */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.90)',
                backdropFilter: 'blur(8px)',
                padding: '4px 8px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <button
                onClick={() => handleEmote('idle')}
                style={{
                  background: currentEmote === 'idle' ? 'rgba(99, 102, 241, 0.5)' : 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? '🧍 Breathe' : '🧍 Đứng Thở'}
              </button>
              <button
                onClick={() => handleEmote('walk')}
                style={{
                  background: currentEmote === 'walk' ? 'rgba(16, 185, 129, 0.5)' : 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? '🚶 Walk' : '🚶 Đi Bộ'}
              </button>
              <button
                onClick={() => handleEmote('howl')}
                style={{
                  background: currentEmote === 'howl' ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? '🐺 Howl' : '🐺 Tru Trăng'}
              </button>
              <button
                onClick={() => handleEmote('point')}
                style={{
                  background: currentEmote === 'point' ? 'rgba(234, 179, 8, 0.5)' : 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? '👉 Point' : '👉 Chỉ Tay'}
              </button>
              <button
                onClick={() => handleEmote('slumber')}
                style={{
                  background: currentEmote === 'slumber' ? 'rgba(148, 163, 184, 0.5)' : 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lang === 'en' ? '💤 Sleep' : '💤 Ngủ Đêm'}
              </button>
            </div>
          </div>

          {/* Configuration Column */}
          <div
            className="wardrobe-config-col"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {/* Input Đặt Tên Nhân Vật */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 23, 42, 0.5)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                {lang === 'en' ? 'YOUR CHARACTER NAME' : 'TÊN NHÂN VẬT CỦA BẠN:'}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={20}
                placeholder={lang === 'en' ? 'Enter camper name...' : 'Nhập tên nhân vật cắm trại...'}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(129, 140, 248, 0.4)',
                  borderRadius: '12px',
                  padding: '6px 12px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0,0,0,0.25)',
              }}
            >
              {[
                { id: 'SKIN', label: lang === 'en' ? '🧑 Character' : '🧑 Nhân Vật' },
                { id: 'HAT', label: lang === 'en' ? '👒 Hats' : '👒 Mũ & Nón' },
                { id: 'EYE', label: lang === 'en' ? '👁️ Neon Eyes' : '👁️ Mắt Neon' },
                { id: 'BACK', label: lang === 'en' ? '🎒 Back' : '🎒 Sau Lưng' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id as any);
                    NativeBridge.hapticImpact('light');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeCategory === tab.id ? '2px solid #818cf8' : '2px solid transparent',
                    color: activeCategory === tab.id ? '#818cf8' : '#94a3b8',
                    fontWeight: activeCategory === tab.id ? 800 : 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Items List Body (Scrollable) */}
            <div
              className="modal-scroll-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* 1. SKIN / CHARACTER OPTIONS */}
              {activeCategory === 'SKIN' &&
                OUTFIT_SKINS.map((item) => {
                  const isSelected = outfit.skinId === item.id;
                  const isOwned = unlockedItems.includes(item.id) || item.price === 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOutfit((prev) => ({ ...prev, skinId: item.id as WolfSkinId }));
                        NativeBridge.hapticImpact('light');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                            {lang === 'en' ? item.nameEn : item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {lang === 'en' ? item.descEn : item.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOwned ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(74, 222, 128, 0.2)',
                              color: '#4ade80',
                              fontWeight: 700,
                            }}
                          >
                            {lang === 'en' ? 'Owned' : 'Đã Có'}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyItem(item.id, item.price, lang === 'en' ? item.nameEn : item.name);
                            }}
                            className="btn btn-ghost"
                            style={{
                              background: 'rgba(234, 179, 8, 0.25)',
                              border: '1px solid #facc15',
                              borderRadius: '10px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#fef08a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>{item.price} 🪙</span>
                          </button>
                        )}
                        {isSelected && <Check size={18} color="#818cf8" />}
                      </div>
                    </div>
                  );
                })}

              {/* 2. HAT OPTIONS */}
              {activeCategory === 'HAT' &&
                OUTFIT_HATS.map((item) => {
                  const isSelected = outfit.hatId === item.id;
                  const isOwned = unlockedItems.includes(item.id) || item.price === 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOutfit((prev) => ({ ...prev, hatId: item.id as WolfHatId }));
                        NativeBridge.hapticImpact('light');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                            {lang === 'en' ? item.nameEn : item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {lang === 'en' ? item.descEn : item.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOwned ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(74, 222, 128, 0.2)',
                              color: '#4ade80',
                              fontWeight: 700,
                            }}
                          >
                            {lang === 'en' ? 'Owned' : 'Đã Có'}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyItem(item.id, item.price, lang === 'en' ? item.nameEn : item.name);
                            }}
                            className="btn btn-ghost"
                            style={{
                              background: 'rgba(234, 179, 8, 0.25)',
                              border: '1px solid #facc15',
                              borderRadius: '10px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#fef08a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>{item.price} 🪙</span>
                          </button>
                        )}
                        {isSelected && <Check size={18} color="#818cf8" />}
                      </div>
                    </div>
                  );
                })}

              {/* 3. EYE OPTIONS */}
              {activeCategory === 'EYE' &&
                OUTFIT_EYES.map((item) => {
                  const isSelected = outfit.eyeGlowId === item.id;
                  const isOwned = unlockedItems.includes(item.id) || item.price === 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOutfit((prev) => ({ ...prev, eyeGlowId: item.id as WolfEyeGlowId }));
                        NativeBridge.hapticImpact('light');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: `#${item.hex.toString(16).padStart(6, '0')}`,
                            boxShadow: `0 0 12px #${item.hex.toString(16).padStart(6, '0')}`,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                            {lang === 'en' ? item.nameEn : item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {lang === 'en' ? item.descEn : item.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOwned ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(74, 222, 128, 0.2)',
                              color: '#4ade80',
                              fontWeight: 700,
                            }}
                          >
                            {lang === 'en' ? 'Owned' : 'Đã Có'}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyItem(item.id, item.price, lang === 'en' ? item.nameEn : item.name);
                            }}
                            className="btn btn-ghost"
                            style={{
                              background: 'rgba(234, 179, 8, 0.25)',
                              border: '1px solid #facc15',
                              borderRadius: '10px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#fef08a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>{item.price} 🪙</span>
                          </button>
                        )}
                        {isSelected && <Check size={18} color="#818cf8" />}
                      </div>
                    </div>
                  );
                })}

              {/* 4. BACK ITEM OPTIONS */}
              {activeCategory === 'BACK' &&
                OUTFIT_BACK_ITEMS.map((item) => {
                  const isSelected = outfit.backItemId === item.id;
                  const isOwned = unlockedItems.includes(item.id) || item.price === 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setOutfit((prev) => ({ ...prev, backItemId: item.id as WolfBackItemId }));
                        NativeBridge.hapticImpact('light');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.07)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>
                            {lang === 'en' ? item.nameEn : item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {lang === 'en' ? item.descEn : item.desc}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOwned ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: 'rgba(74, 222, 128, 0.2)',
                              color: '#4ade80',
                              fontWeight: 700,
                            }}
                          >
                            {lang === 'en' ? 'Owned' : 'Đã Có'}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuyItem(item.id, item.price, lang === 'en' ? item.nameEn : item.name);
                            }}
                            className="btn btn-ghost"
                            style={{
                              background: 'rgba(234, 179, 8, 0.25)',
                              border: '1px solid #facc15',
                              borderRadius: '10px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#fef08a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>{item.price} 🪙</span>
                          </button>
                        )}
                        {isSelected && <Check size={18} color="#818cf8" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer Buttons (Pinned) */}
            <div
              className="modal-pinned-footer"
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '10px',
                background: 'rgba(10, 10, 18, 0.96)',
              }}
            >
              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '14px', fontSize: '0.82rem' }}
              >
                {lang === 'en' ? 'Cancel' : 'Hủy Bỏ'}
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                }}
              >
                <Sparkles size={16} />
                <span>{lang === 'en' ? 'Save & Wear Outfit' : 'Lưu & Mặc Trang Phục'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
