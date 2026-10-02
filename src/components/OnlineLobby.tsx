import React, { useState, useEffect } from 'react';
import { roomManager } from '../logic/roomManager';
import { ClientGameState } from '../types/multiplayer';
import { OnlinePlayerGameView } from './OnlinePlayerGameView';
import { Users, Crown, CheckCircle2, Clock, Copy, Check, ArrowLeft, Play, LogOut, ShieldAlert } from 'lucide-react';

interface Props {
  onBackToOffline: () => void;
  onGameStarted?: (state: ClientGameState) => void;
}

const AVATARS = ['🐺', '🧙', '🔮', '🛡️', '🏹', '👑', '🎭', '🧛', '🦊', '⚡'];

export const OnlineLobby: React.FC<Props> = ({ onBackToOffline, onGameStarted }) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🐺');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [activeView, setActiveView] = useState<'SELECT' | 'CREATE' | 'JOIN' | 'ROOM'>('SELECT');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Trạng thái phiên hiện tại trong phòng
  const [currentSession, setCurrentSession] = useState<{
    roomId: string;
    playerId: string;
    sessionToken: string;
  } | null>(null);

  const [gameState, setGameState] = useState<ClientGameState | null>(null);

  // Đăng ký lắng nghe thay đổi trạng thái phòng từ RoomManager
  useEffect(() => {
    if (!currentSession) return;

    const unsubscribe = roomManager.subscribe(currentSession.roomId, (targetPlayerId, newState) => {
      if (targetPlayerId === currentSession.playerId) {
        setGameState(newState);
        if (newState.phase !== 'LOBBY' && onGameStarted) {
          onGameStarted(newState);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentSession, onGameStarted]);

  // Xử lý tạo phòng
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn');
      return;
    }
    setErrorMessage(null);

    try {
      const res = roomManager.createRoom(playerName.trim(), selectedAvatar);
      setCurrentSession({
        roomId: res.roomId,
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      setGameState(res.state);
      setActiveView('ROOM');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi tạo phòng');
    }
  };

  // Xử lý vào phòng
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn');
      return;
    }
    if (!inputRoomCode.trim()) {
      setErrorMessage('Vui lòng nhập mã phòng gồm 6 ký tự');
      return;
    }
    setErrorMessage(null);

    try {
      const res = roomManager.joinRoom(inputRoomCode.trim().toUpperCase(), playerName.trim(), selectedAvatar);
      setCurrentSession({
        roomId: inputRoomCode.trim().toUpperCase(),
        playerId: res.playerId,
        sessionToken: res.sessionToken,
      });
      setGameState(res.state);
      setActiveView('ROOM');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể vào phòng');
    }
  };

  // Sao chép mã phòng
  const handleCopyCode = () => {
    if (!currentSession) return;
    navigator.clipboard.writeText(currentSession.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sẵn sàng / Hủy sẵn sàng
  const handleToggleReady = () => {
    if (!currentSession || !gameState) return;
    const me = gameState.players.find((p) => p.id === currentSession.playerId);
    if (!me) return;

    roomManager.toggleReady(currentSession.roomId, currentSession.playerId, !me.isReady);
  };

  // Host bấm bắt đầu
  const handleStartGame = () => {
    if (!currentSession || !gameState) return;
    try {
      setErrorMessage(null);
      roomManager.startGame(currentSession.roomId, currentSession.playerId);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể bắt đầu ván đấu');
    }
  };

  // Rời phòng
  const handleLeaveRoom = () => {
    setCurrentSession(null);
    setGameState(null);
    setActiveView('SELECT');
  };

  const isHost = gameState?.players.find((p) => p.id === currentSession?.playerId)?.isHost;
  const me = gameState?.players.find((p) => p.id === currentSession?.playerId);

  return (
    <div style={{ padding: '16px', maxWidth: '640px', margin: '0 auto', color: '#fff' }}>
      {/* Nút quay lại Offline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={activeView === 'ROOM' ? handleLeaveRoom : onBackToOffline}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e2e8f0',
            padding: '8px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> {activeView === 'ROOM' ? 'Rời Phòng' : 'Về Chế Độ Offline'}
        </button>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px' }}>
          MULTI-PLAYER ONLINE
        </span>
      </div>

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ShieldAlert size={18} /> {errorMessage}
        </div>
      )}

      {/* VIEW 1: Chọn Tạo Phòng hoặc Vào Phòng */}
      {activeView === 'SELECT' && (
        <div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🐺🌕</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
              MA SÓI TRỰC TUYẾN
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
              Tạo phòng thi đấu nhiều người chơi hoặc tham gia cùng bạn bè
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginTop: '10px' }}>
            <button
              onClick={() => setActiveView('CREATE')}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #3730a3)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                color: '#fff',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                👑
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tạo Phòng Chơi Mới</div>
                <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '2px' }}>
                  Làm Chủ phòng, nhận mã 6 số và mời bạn bè tham gia
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveView('JOIN')}
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                🔑
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Vào Phòng Bằng Mã</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Nhập mã phòng 6 ký tự được bạn bè chia sẻ
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: Form Tạo Phòng */}
      {activeView === 'CREATE' && (
        <form onSubmit={handleCreateRoom} style={{ background: '#12121e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0' }}>👑 Tạo Phòng Mới</h2>
          
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tên của bạn:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ví dụ: Minh Quân (Host)"
            maxLength={18}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Chọn Avatar:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                style={{
                  fontSize: '1.5rem',
                  padding: '8px 12px',
                  background: selectedAvatar === av ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: selectedAvatar === av ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                {av}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveView('SELECT')}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', borderRadius: '10px', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: '12px', background: '#4f46e5', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tạo & Nhận Mã Phòng
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: Form Vào Phòng */}
      {activeView === 'JOIN' && (
        <form onSubmit={handleJoinRoom} style={{ background: '#12121e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0' }}>🔑 Vào Phòng Chơi</h2>

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Mã phòng 6 ký tự:</label>
          <input
            type="text"
            value={inputRoomCode}
            onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
            placeholder="Ví dụ: WLKF88"
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '2px solid #6366f1',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Tên của bạn:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Ví dụ: Hoàng Long"
            maxLength={18}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e1e2f',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Chọn Avatar:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                style={{
                  fontSize: '1.5rem',
                  padding: '8px 12px',
                  background: selectedAvatar === av ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: selectedAvatar === av ? '2px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                {av}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveView('SELECT')}
              style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#e2e8f0', borderRadius: '10px', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ flex: 2, padding: '12px', background: '#059669', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tham Gia Phòng
            </button>
          </div>
        </form>
      )}

      {/* VIEW 4: Phòng Chờ (Lobby Room) hoặc Màn Hình Ván Đấu Trực Tuyến */}
      {activeView === 'ROOM' && gameState && currentSession && (
        gameState.phase !== 'LOBBY' ? (
          <OnlinePlayerGameView
            gameState={gameState}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <div>
            {/* Card Mã Phòng & Link Chia Sẻ */}
            <div style={{
            background: 'linear-gradient(135deg, #1e1b4b, #0f172a)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
              MÃ PHÒNG CHƠI
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '6px',
              color: '#38bdf8',
              margin: '6px 0',
              fontFamily: 'Montserrat, monospace',
            }}>
              {currentSession.roomId}
            </div>
            <button
              onClick={handleCopyCode}
              style={{
                background: copiedCode ? '#059669' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              {copiedCode ? 'Đã Sao Chép Mã!' : 'Sao Chép Mã Phòng'}
            </button>
          </div>

          {/* Thanh Thông Tin Phòng */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#94a3b8' }}>
              <Users size={16} />
              <span>Người chơi: <strong style={{ color: '#fff' }}>{gameState.players.length}/12</strong></span>
            </div>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              ĐANG ĐỢI BẮT ĐẦU
            </span>
          </div>

          {/* Danh Sách Ghế Ngồi Người Chơi */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {gameState.players.map((p) => (
              <div
                key={p.id}
                style={{
                  background: p.id === currentSession.playerId ? 'rgba(99, 102, 241, 0.15)' : '#161622',
                  border: p.id === currentSession.playerId ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '8px',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: 700,
                }}>
                  #{p.seatNumber}
                </div>
                {p.isHost && (
                  <div style={{ position: 'absolute', top: '6px', right: '8px' }}>
                    <Crown size={14} color="#f59e0b" />
                  </div>
                )}
                <div style={{ fontSize: '2rem', margin: '8px 0 4px 0' }}>{p.avatar}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name} {p.id === currentSession.playerId && '(Bạn)'}
                </div>
                <div style={{ marginTop: '6px' }}>
                  {p.isHost ? (
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Chủ Phòng</span>
                  ) : p.isReady ? (
                    <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <CheckCircle2 size={12} /> Sẵn sàng
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Clock size={12} /> Chờ...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar dưới cùng */}
          <div style={{
            position: 'sticky',
            bottom: '16px',
            background: 'rgba(10, 10, 18, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            {isHost ? (
              <button
                onClick={handleStartGame}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Play size={18} fill="#fff" /> BẮT ĐẦU VÁN ĐẤU ({gameState.players.length} người)
              </button>
            ) : (
              <button
                onClick={handleToggleReady}
                style={{
                  flex: 1,
                  background: me?.isReady ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: me?.isReady ? '1px solid #ef4444' : 'none',
                  color: me?.isReady ? '#fca5a5' : '#fff',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                {me?.isReady ? 'HỦY SẴN SÀNG' : 'TÔI ĐÃ SẴN SÀNG'}
              </button>
            )}

            <button
              onClick={handleLeaveRoom}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ef4444',
                padding: '14px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Rời phòng"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        )
      )}
    </div>
  );
};
