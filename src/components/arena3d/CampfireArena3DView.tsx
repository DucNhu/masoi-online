import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CampfireScene } from './CampfireScene';
import { SeatPlayerInfo, PlayerOutfitConfig, DEFAULT_OUTFIT } from './types';
import { Wardrobe3DModal } from './Wardrobe3DModal';
import { NativeBridge } from '../../utils/nativeBridge';
import { Sparkles, Sun, Moon, RotateCcw } from 'lucide-react';

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

export const CampfireArena3DView: React.FC<CampfireArena3DViewProps> = ({
  players,
  isNight: propIsNight = true,
  currentRound = 1,
  onSeatSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<CampfireScene | null>(null);

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isNightMode, setIsNightMode] = useState<boolean>(propIsNight);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [myOutfit, setMyOutfit] = useState<PlayerOutfitConfig>(() => {
    try {
      const saved = localStorage.getItem('ma_soi_player_outfit');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OUTFIT;
  });

  // Đồng bộ props ban đêm khi có thay đổi từ game engine
  useEffect(() => {
    setIsNightMode(propIsNight);
    if (sceneRef.current) {
      sceneRef.current.setPhase(propIsNight);
    }
  }, [propIsNight]);

  // Tạo dữ liệu cho 10 ghế
  const seatsData: SeatPlayerInfo[] = useMemo(() => {
    const list: SeatPlayerInfo[] = [];
    for (let i = 1; i <= 10; i++) {
      const p = players?.find((item) => item.seatNumber === i);
      const isMe = i === 1; // Ghế 1 tượng trưng cho người chơi hiện tại

      // Phân bổ outfit mẫu phong phú cho 10 người chơi
      const defaultSkin = i % 2 === 0 ? 'WOLF_GRAY' : i % 3 === 0 ? 'WOLF_BLOOD' : i % 5 === 0 ? 'WOLF_GOLD' : 'WOLF_SNOW';
      const defaultHat = i === 1 ? myOutfit.hatId : i === 2 ? 'CONICAL_HAT' : i === 4 ? 'WITCH' : i === 7 ? 'CROWN' : 'NONE';
      const defaultBack = i === 1 ? myOutfit.backItemId : i === 3 ? 'SWORD' : i === 6 ? 'CAPE' : 'NONE';

      list.push({
        seatNumber: i,
        name: p?.name || `Người Chơi ${i}`,
        isAlive: p ? p.isAlive : true,
        isWerewolf: Boolean(p?.roleId === 'WEREWOLF' || p?.roleId?.includes('WOLF')),
        deathReason: p?.deathReason,
        outfit: isMe
          ? myOutfit
          : {
              skinId: defaultSkin,
              hatId: defaultHat as any,
              eyeGlowId: (i % 2 === 0 ? 'RED' : 'YELLOW') as any,
              backItemId: defaultBack as any,
            },
      });
    }
    return list;
  }, [players, myOutfit]);

  // Khởi tạo Three.js Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new CampfireScene(canvasRef.current);
    sceneRef.current = scene;

    scene.setPhase(isNightMode);
    scene.updateSeatsState(seatsData);

    scene.setOnSeatClick((seatNumber) => {
      NativeBridge.hapticImpact('medium');
      setSelectedSeat(seatNumber);
      if (onSeatSelect) onSeatSelect(seatNumber);
    });

    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        sceneRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Cập nhật trạng thái ghế
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateSeatsState(seatsData);
    }
  }, [seatsData, isNightMode]);

  const toggleNightDay = () => {
    const nextState = !isNightMode;
    setIsNightMode(nextState);
    if (sceneRef.current) {
      sceneRef.current.setPhase(nextState);
    }
    NativeBridge.hapticImpact('light');
  };

  const selectedPlayer = seatsData.find((s) => s.seatNumber === selectedSeat);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        backgroundColor: '#070710',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        border: '1.5px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'grab',
        }}
      />

      {/* Top Floating HUD Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        {/* Info Chip */}
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isNightMode ? '#818cf8' : '#f59e0b',
              boxShadow: isNightMode ? '0 0 8px #818cf8' : '0 0 8px #f59e0b',
            }}
          />
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
            {isNightMode ? `ĐÊM ${currentRound} • ĐỐNG LỬA` : `BÌNH MINH ${currentRound} • THẢO LUẬN`}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>| 10 Chỗ</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          {/* Day / Night Toggle */}
          <button
            onClick={toggleNightDay}
            className="btn btn-ghost btn-icon-only"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              width: '36px',
              height: '36px',
              borderRadius: '12px',
            }}
            title={isNightMode ? 'Chuyển sang Ban Ngày' : 'Chuyển sang Ban Đêm'}
          >
            {isNightMode ? <Sun size={17} color="#facc15" /> : <Moon size={17} color="#a5b4fc" />}
          </button>

          {/* 3D Wardrobe Button */}
          <button
            onClick={() => {
              setIsWardrobeOpen(true);
              NativeBridge.hapticImpact('medium');
            }}
            className="btn btn-ghost"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)',
              border: '1px solid rgba(165, 180, 252, 0.4)',
              borderRadius: '14px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="#a5b4fc" /> Tủ Đồ 3D
          </button>
        </div>
      </div>

      {/* Camera Navigation Guidance */}
      <div
        style={{
          position: 'absolute',
          bottom: selectedSeat ? '140px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          transition: 'bottom 0.3s ease',
        }}
      >
        <RotateCcw size={12} /> Vuốt màn hình để xoay quanh đống lửa • Chạm vào nhân vật để xem
      </div>

      {/* Selected Player Bottom Card */}
      {selectedPlayer && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(129, 140, 248, 0.4)',
            borderRadius: '18px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            animation: 'slideUp 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                color: selectedPlayer.isAlive ? '#818cf8' : '#ef4444',
                fontSize: '1rem',
              }}
            >
              #{selectedPlayer.seatNumber}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                {selectedPlayer.name}
              </div>
              <div style={{ fontSize: '0.76rem', color: selectedPlayer.isAlive ? '#4ade80' : '#f87171' }}>
                {selectedPlayer.isAlive ? '🟢 Đang Còn Sống' : `💀 Đã Hy Sinh (${selectedPlayer.deathReason || 'Bị sát hại'})`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedSeat(null)}
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem', padding: '6px 10px', color: '#94a3b8' }}
          >
            Đóng
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
          NativeBridge.hapticNotification('success');
        }}
      />
    </div>
  );
};
