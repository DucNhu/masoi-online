import React, { useState, useEffect, useRef } from 'react';
import { ClientGameState } from '../types/multiplayer';
import { roomManager } from '../logic/roomManager';
import { soundEffects } from '../utils/soundEffects';
import { NetworkStatusBadge } from './NetworkStatusBadge';
import { MatchHistoryModal } from './MatchHistoryModal';
import { 
  Eye, 
  LogOut, 
  Users, 
  Send, 
  MessageSquare, 
  Scroll, 
  Moon, 
  Sun, 
  Vote, 
  Trophy, 
  Crown, 
  Heart, 
  Flame, 
  Sparkles 
} from 'lucide-react';

interface SpectatorLiveViewProps {
  gameState: ClientGameState;
  spectatorName: string;
  onLeave: () => void;
}

const CHEER_OPTIONS = [
  { emoji: '👏', label: 'Vỗ tay', sound: 'dawn' },
  { emoji: '❤️', label: 'Cổ vũ', sound: 'haptic' },
  { emoji: '🔥', label: 'Kịch tính', sound: 'gavel' },
  { emoji: '🐺', label: 'Hú sói', sound: 'wolf' },
  { emoji: '🍿', label: 'Hóng biến', sound: 'haptic' },
];

export const SpectatorLiveView: React.FC<SpectatorLiveViewProps> = ({
  gameState,
  spectatorName,
  onLeave,
}) => {
  const [activeTab, setActiveTab] = useState<'SPECTATOR' | 'PUBLIC'>('SPECTATOR');
  const [chatInput, setChatInput] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [flyingCheers, setFlyingCheers] = useState<{ id: string; emoji: string; left: number }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastCheerIdRef = useRef<string | null>(null);

  // Tự động cuộn xuống cuối khung chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [gameState.chatMessages, activeTab]);

  // Lắng nghe Live Cheers mới để tạo hiệu ứng bay bồng bềnh
  useEffect(() => {
    if (!gameState.liveCheers || gameState.liveCheers.length === 0) return;
    const latest = gameState.liveCheers[gameState.liveCheers.length - 1];
    if (latest && latest.id !== lastCheerIdRef.current) {
      lastCheerIdRef.current = latest.id;
      const flyingId = `fly_${Date.now()}_${Math.random()}`;
      const randomLeft = 20 + Math.random() * 60; // 20% -> 80% width
      setFlyingCheers((prev) => [...prev, { id: flyingId, emoji: latest.emoji, left: randomLeft }]);

      setTimeout(() => {
        setFlyingCheers((prev) => prev.filter((item) => item.id !== flyingId));
      }, 2500);
    }
  }, [gameState.liveCheers]);

  // Gửi cổ vũ
  const handleSendCheer = (emoji: string, soundType: string) => {
    soundEffects.triggerHaptic('light');
    if (soundType === 'wolf') soundEffects.playWolfHowl();
    else if (soundType === 'gavel') soundEffects.playCourtGavel();
    else if (soundType === 'dawn') soundEffects.playDawnChime();

    try {
      roomManager.sendCheer(gameState.roomId, spectatorName, emoji);
    } catch {
      // ignore
    }
  };

  // Gửi tin nhắn chat
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    try {
      roomManager.sendChatMessage(gameState.roomId, gameState.myPlayerId, text, activeTab);
      setChatInput('');
      soundEffects.triggerHaptic('light');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Không thể gửi tin nhắn.');
    }
  };

  // Lọc tin nhắn theo tab
  const displayMessages = (gameState.chatMessages || []).filter((msg) => {
    if (activeTab === 'SPECTATOR') return msg.channel === 'SPECTATOR';
    return msg.channel === 'PUBLIC';
  });

  const livingPlayersCount = gameState.players.filter((p) => p.isAlive).length;

  return (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', color: '#fff', position: 'relative' }}>
      {/* Hiệu ứng Floating Live Cheers */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999 }}>
        {flyingCheers.map((c) => (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              left: `${c.left}%`,
              bottom: '120px',
              fontSize: '2rem',
              animation: 'floatUpAndFade 2.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards',
            }}
          >
            {c.emoji}
          </div>
        ))}
      </div>

      {/* HEADER KHÁN ĐÀI */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={onLeave}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '6px 12px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <LogOut size={14} /> Rời Khán Đài
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NetworkStatusBadge />
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Eye size={12} />
            <span>{gameState.spectatorsCount || 1} Khán Giả</span>
          </div>
        </div>
      </div>

      {/* BANNER TRẠNG THÁI VÁN ĐẤU THỜI GIAN THỰC */}
      <div
        className="card-glass"
        style={{
          padding: '16px',
          borderRadius: '18px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {gameState.tableName || `Bàn #${gameState.roomId}`}
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
            {gameState.phase === 'LOBBY' && '⏳ Đang Chuẩn Bị Vào Bàn'}
            {gameState.phase === 'NIGHT' && `🌙 Đêm Thứ ${gameState.dayNumber} (Trăng Máu)`}
            {gameState.phase === 'DAY_DISCUSSION' && `☀️ Ngày Thứ ${gameState.dayNumber} (Làng Thảo Luận)`}
            {gameState.phase === 'DAY_VOTING' && `⚖️ Ngày Thứ ${gameState.dayNumber} (Bỏ Phiếu Treo Cổ)`}
            {gameState.phase === 'DAY_HANGING' && '⚡ Phán Quyết Xử Tử'}
            {gameState.phase === 'GAME_OVER' && '🏆 Ván Đấu Kết Thúc'}
          </h2>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Còn sống: <strong style={{ color: '#4ade80' }}>{livingPlayersCount}</strong> / {gameState.players.length} người chơi
          </div>
        </div>

        <button
          onClick={() => {
            soundEffects.triggerHaptic('light');
            setShowHistoryModal(true);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#e2e8f0',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Scroll size={14} /> Nhật Ký
        </button>
      </div>

      {/* VÒNG TRÒN GHẾ NGỒI CỦA NGƯỜI CHƠI TRÊN BÀN */}
      <div
        className="card-glass"
        style={{
          padding: '16px',
          borderRadius: '18px',
          marginBottom: '16px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
            DANH SÁCH BÀN TRÒN ({gameState.players.length} Ghế)
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            🛡️ Chống soi vai trò người sống
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          {gameState.players.map((player) => {
            const revealedRole = gameState.revealedRoles[player.id];
            return (
              <div
                key={player.id}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: player.isAlive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.4)',
                  border: player.isAlive ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(239, 68, 68, 0.2)',
                  opacity: player.isAlive ? 1 : 0.5,
                  textAlign: 'center',
                  position: 'relative',
                  filter: player.isAlive ? 'none' : 'grayscale(0.6)',
                }}
              >
                {player.isMayor && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      fontSize: '0.8rem',
                    }}
                    title="Thị Trưởng"
                  >
                    👑
                  </span>
                )}

                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{player.avatar}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {player.name}
                </div>

                <div style={{ fontSize: '0.68rem', marginTop: '3px', fontWeight: 600 }}>
                  {!player.isAlive ? (
                    <span style={{ color: '#ef4444' }}>
                      💀 {revealedRole || 'Đã chết'}
                    </span>
                  ) : revealedRole ? (
                    <span style={{ color: '#38bdf8' }}>{revealedRole}</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>🟢 Còn sống</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THANH CỔ VŨ LIVE CHEERS */}
      <div
        className="card-glass"
        style={{
          padding: '12px 16px',
          borderRadius: '16px',
          marginBottom: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>
          ✨ CỔ VŨ BÀN:
        </span>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {CHEER_OPTIONS.map((cheer) => (
            <button
              key={cheer.emoji}
              onClick={() => handleSendCheer(cheer.emoji, cheer.sound)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#fff',
                transition: 'transform 0.15s ease',
              }}
              title={cheer.label}
            >
              <span>{cheer.emoji}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{cheer.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KHUNG TRÒ CHUYỆN KHÁN ĐÀI */}
      <div
        className="card-glass"
        style={{
          borderRadius: '18px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '320px',
        }}
      >
        {/* Tabs chuyển kênh */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setActiveTab('SPECTATOR')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'SPECTATOR' ? 'rgba(168, 85, 247, 0.15)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'SPECTATOR' ? '2px solid #c084fc' : 'none',
              color: activeTab === 'SPECTATOR' ? '#c084fc' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            👀 Kênh Khán Giả
          </button>
          <button
            onClick={() => setActiveTab('PUBLIC')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'PUBLIC' ? 'rgba(56, 189, 248, 0.15)' : 'none',
              border: 'none',
              borderBottom: activeTab === 'PUBLIC' ? '2px solid #38bdf8' : 'none',
              color: activeTab === 'PUBLIC' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            🗣️ Thảo Luận Làng
          </button>
        </div>

        {/* Danh sách tin nhắn */}
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {displayMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginTop: '40px' }}>
              Chưa có tin nhắn nào trong kênh này. Hãy là người đầu tiên lên tiếng!
            </div>
          ) : (
            displayMessages.map((msg) => (
              <div key={msg.id} style={{ fontSize: '0.78rem' }}>
                <span style={{ marginRight: '6px' }}>{msg.senderAvatar}</span>
                <strong style={{ color: msg.senderId === gameState.myPlayerId ? '#c084fc' : '#e2e8f0', marginRight: '6px' }}>
                  {msg.senderName}:
                </strong>
                <span style={{ color: '#cbd5e1' }}>{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* Khung nhập tin nhắn */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={activeTab === 'SPECTATOR' ? 'Bình luận cùng các khán giả khác...' : 'Theo dõi thảo luận...'}
            disabled={activeTab === 'PUBLIC'} // Khán giả chỉ chat kênh SPECTATOR
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || activeTab === 'PUBLIC'}
            style={{
              background: activeTab === 'SPECTATOR' ? '#9333ea' : '#475569',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#fff',
              cursor: activeTab === 'SPECTATOR' ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* MODAL NHẬT KÝ VÁN ĐẤU */}
      <MatchHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        roomId={gameState.roomId}
        historyLog={gameState.historyLog || []}
        winner={gameState.winner}
      />
    </div>
  );
};
