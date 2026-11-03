import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WolfCharacter } from './WolfMeshBuilder';
import {
  PlayerOutfitConfig,
  DEFAULT_OUTFIT,
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
import { Sparkles, RotateCw, Check, X } from 'lucide-react';

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
  const [currentEmote, setCurrentEmote] = useState<'idle' | 'howl' | 'point' | 'slumber'>('idle');

  // Khởi tạo Three.js preview scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c16);

    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 20);
    camera.position.set(0, 1.3, 4.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Ánh sáng Studio tạo khối
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xa5b4fc, 2.0);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.2);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // Bục đứng gỗ xoay (Pedestal)
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, flatShading: true });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.25, 16), pedestalMat);
    pedestal.position.y = -0.125;
    scene.add(pedestal);

    // Nhân vật sói
    const character = new WolfCharacter(outfit);
    character.root.position.y = 0;
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
          // Tự xoay nhẹ nhàng khi không kéo
          characterRef.current.root.rotation.y += delta * 0.4;
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

  const handleEmote = (emote: 'idle' | 'howl' | 'point' | 'slumber') => {
    setCurrentEmote(emote);
    if (characterRef.current) {
      characterRef.current.setAnimation(emote);
    }
    NativeBridge.hapticImpact('light');
  };

  const handleSave = () => {
    NativeBridge.hapticNotification('success');
    localStorage.setItem('ma_soi_player_outfit', JSON.stringify(outfit));
    onSaveOutfit(outfit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="modal-fixed-shell"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '94dvh',
          backgroundColor: '#0f111c',
          borderRadius: '24px',
          border: '1.5px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.9), 0 0 30px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.4) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🐺</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                Phòng Thay Đồ 3D
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                Tùy biến diện mạo chiến binh sói low-poly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon-only"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} color="#94a3b8" />
          </button>
        </div>

        {/* 3D Viewport Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: 'radial-gradient(circle at center, #1e1b4b 0%, #080811 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          {/* Hint drag rotate */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(0,0,0,0.5)',
              padding: '4px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              pointerEvents: 'none',
            }}
          >
            <RotateCw size={12} /> Vuốt để xoay 360°
          </div>

          {/* Emote Quick Test Buttons */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '4px 6px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <button
              onClick={() => handleEmote('idle')}
              style={{
                background: currentEmote === 'idle' ? 'rgba(99, 102, 241, 0.5)' : 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Thở
            </button>
            <button
              onClick={() => handleEmote('howl')}
              style={{
                background: currentEmote === 'howl' ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Tru Trăng
            </button>
            <button
              onClick={() => handleEmote('point')}
              style={{
                background: currentEmote === 'point' ? 'rgba(234, 179, 8, 0.5)' : 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Chỉ Tay
            </button>
            <button
              onClick={() => handleEmote('slumber')}
              style={{
                background: currentEmote === 'slumber' ? 'rgba(148, 163, 184, 0.5)' : 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Ngủ Đêm
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          {[
            { id: 'SKIN', label: 'Màu Lông' },
            { id: 'HAT', label: 'Mũ & Nón' },
            { id: 'EYE', label: 'Mắt Neon' },
            { id: 'BACK', label: 'Sau Lưng' },
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
                fontWeight: activeCategory === tab.id ? 700 : 500,
                fontSize: '0.8rem',
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
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* SKIN OPTIONS */}
          {activeCategory === 'SKIN' &&
            OUTFIT_SKINS.map((item) => {
              const isSelected = outfit.skinId === item.id;
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
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: `#${item.hex.toString(16).padStart(6, '0')}`,
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        boxShadow: `0 0 10px #${item.hex.toString(16).padStart(6, '0')}60`,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={18} color="#818cf8" />}
                </div>
              );
            })}

          {/* HAT OPTIONS */}
          {activeCategory === 'HAT' &&
            OUTFIT_HATS.map((item) => {
              const isSelected = outfit.hatId === item.id;
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
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={18} color="#818cf8" />}
                </div>
              );
            })}

          {/* EYE OPTIONS */}
          {activeCategory === 'EYE' &&
            OUTFIT_EYES.map((item) => {
              const isSelected = outfit.eyeGlowId === item.id;
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
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: `#${item.hex.toString(16).padStart(6, '0')}`,
                        boxShadow: `0 0 12px #${item.hex.toString(16).padStart(6, '0')}`,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={18} color="#818cf8" />}
                </div>
              );
            })}

          {/* BACK ITEM OPTIONS */}
          {activeCategory === 'BACK' &&
            OUTFIT_BACK_ITEMS.map((item) => {
              const isSelected = outfit.backItemId === item.id;
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
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={18} color="#818cf8" />}
                </div>
              );
            })}
        </div>

        {/* Footer Buttons (Pinned) */}
        <div
          className="modal-pinned-footer"
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(10, 10, 18, 0.95)',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', borderRadius: '14px' }}
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 800,
            }}
          >
            <Sparkles size={16} /> Lưu Trang Phục 3D
          </button>
        </div>
      </div>
    </div>
  );
};
