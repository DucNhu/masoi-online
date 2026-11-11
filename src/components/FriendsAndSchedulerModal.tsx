import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Bell,
  BellRing,
  Copy,
  Check,
  Plus,
  Trash2,
  X,
  Sparkles,
  Tent,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import {
  friendService,
  generateHunterCode,
  type FriendEntry,
  type FriendRequest,
} from '../logic/friendService';
import {
  schedulerService,
  formatMatchCountdown,
  formatScheduledTime,
  type ScheduledMatch,
} from '../logic/schedulerService';
import { notificationService } from '../logic/notificationService';
import { NativeBridge } from '../utils/nativeBridge';

interface FriendsAndSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onJoinTable?: (tableName: string) => void;
}

export const FriendsAndSchedulerModal: React.FC<FriendsAndSchedulerModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onJoinTable,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'schedule' | 'matches'>('friends');
  const [copiedCode, setCopiedCode] = useState(false);

  // Friend state
  const [targetInput, setTargetInput] = useState('');
  const [friendActionMsg, setFriendActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  // Schedule state
  const [selectedFriend, setSelectedFriend] = useState<string>('all');
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [selectedTable, setSelectedTable] = useState<string>('Lều Bàn 1 (Hang Sói)');
  const [matchNotes, setMatchNotes] = useState<string>('AE đúng giờ vào chiến nhé!');
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Matches state
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [now, setNow] = useState(() => Date.now());

  // Reload data
  const refreshData = () => {
    if (!currentUsername) return;
    setFriends(friendService.getFriends(currentUsername));
    setPendingRequests(friendService.getPendingRequests(currentUsername));
    setMatches(schedulerService.getMatchesForUser(currentUsername));
    setNotifPermission(notificationService.getPermission());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      NativeBridge.hapticImpact('light');
    }
  }, [isOpen, currentUsername]);

  // Real-time timer update countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const myHunterCode = generateHunterCode(currentUsername);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(myHunterCode);
      setCopiedCode(true);
      NativeBridge.hapticImpact('medium');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendFriendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim()) return;

    const res = friendService.sendRequest(currentUsername, currentUsername, targetInput.trim());
    if (res.ok) {
      setFriendActionMsg({ type: 'ok', text: res.message });
      setTargetInput('');
      NativeBridge.hapticImpact('medium');
    } else {
      setFriendActionMsg({ type: 'err', text: res.message });
      NativeBridge.hapticNotification('error');
    }
    refreshData();
    setTimeout(() => setFriendActionMsg(null), 4000);
  };

  const handleAcceptRequest = (reqId: string) => {
    const res = friendService.acceptRequest(reqId, currentUsername);
    if (res.ok) {
      setFriendActionMsg({ type: 'ok', text: res.message });
      NativeBridge.hapticImpact('heavy');
    }
    refreshData();
    setTimeout(() => setFriendActionMsg(null), 3000);
  };

  const handleDeclineRequest = (reqId: string) => {
    friendService.declineRequest(reqId);
    refreshData();
  };

  const handleRemoveFriend = (friendName: string) => {
    friendService.removeFriend(currentUsername, friendName);
    NativeBridge.hapticImpact('light');
    refreshData();
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = friends.find((f) => f.username === selectedFriend);

    schedulerService.createMatch({
      hostUsername: currentUsername,
      hostDisplayName: currentUsername,
      targetFriendUsername: target ? target.username : undefined,
      targetFriendDisplayName: target ? target.displayName : undefined,
      tableName: selectedTable,
      hoursLater: selectedHours,
      notes: matchNotes,
    });

    NativeBridge.hapticImpact('heavy');
    setScheduleSuccessMsg(`Đã tạo lịch hẹn thành công lúc ${selectedHours} tiếng nữa!`);
    refreshData();
    setTimeout(() => {
      setScheduleSuccessMsg(null);
      setActiveTab('matches');
    }, 1200);
  };

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      NativeBridge.hapticNotification('success');
      void notificationService.testNotification();
    }
  };

  const handleCancelMatch = (matchId: string) => {
    schedulerService.cancelMatch(matchId, currentUsername);
    NativeBridge.hapticImpact('light');
    refreshData();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          background: 'linear-gradient(145deg, #121422 0%, #1a1b2e 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Users size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.3px' }}>
                Bạn Bè & Lịch Hẹn Chơi
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Mã Thợ Săn & Hẹn ván ma sói (Nhắc trước 15p)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'friends' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: activeTab === 'friends' ? '#34d399' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Users size={15} />
            <span>Bạn Bè ({friends.length})</span>
            {pendingRequests.length > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                }}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'schedule' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: activeTab === 'schedule' ? '#fbbf24' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Clock size={15} />
            <span>+ Hẹn Giờ Chơi</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'matches' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'matches' ? '#c084fc' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Bell size={15} />
            <span>Lịch Đã Hẹn ({matches.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: BẠN BÈ */}
          {activeTab === 'friends' && (
            <div>
              {/* My Hunter Code Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.25))',
                  border: '1px dashed rgba(52, 211, 153, 0.4)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 600 }}>
                    MÃ THỢ SĂN CỦA BẠN (HUNTER CODE)
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '1px' }}>
                    {myHunterCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(52, 211, 153, 0.5)',
                    background: copiedCode ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>

              {/* Add Friend Form */}
              <form onSubmit={handleSendFriendRequest} style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  KẾT BẠN MỚI
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="Nhập Tên tài khoản hoặc Hunter Code..."
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} />
                    <span>Kết Bạn</span>
                  </button>
                </div>
              </form>

              {/* Action feedback message */}
              {friendActionMsg && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: friendActionMsg.type === 'ok' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                    color: friendActionMsg.type === 'ok' ? '#34d399' : '#f87171',
                    border: `1px solid ${friendActionMsg.type === 'ok' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
                  }}
                >
                  {friendActionMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{friendActionMsg.text}</span>
                </div>
              )}

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    LỜI MỜI KẾT BẠN ĐANG CHỜ ({pendingRequests.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{req.fromDisplayName}</div>
                          <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{req.fromHunterCode}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.id)}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#94a3b8',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                DANH SÁCH BẠN BÈ ({friends.length})
              </span>
              {friends.length === 0 ? (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Users size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                    Chưa có bạn bè nào. Hãy gửi Hunter Code cho nhau để kết nối nhé!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {friends.map((f) => (
                    <div
                      key={f.username}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                          }}
                        >
                          {f.displayName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{f.displayName}</div>
                          <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>{f.hunterCode}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setSelectedFriend(f.username);
                            setActiveTab('schedule');
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(245, 158, 11, 0.18)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '8px',
                            color: '#fbbf24',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Clock size={13} />
                          <span>Hẹn giờ</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(f.username)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '6px',
                          }}
                          title="Hủy kết bạn"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HẸN GIỜ CHƠI */}
          {activeTab === 'schedule' && (
            <form onSubmit={handleCreateMatch}>
              {/* Select Friend */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  MỜI AI THAM GIA:
                </label>
                <select
                  value={selectedFriend}
                  onChange={(e) => setSelectedFriend(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="all">🌐 Cả nhóm / Bạn bất kỳ (Mở công khai)</option>
                  {friends.map((f) => (
                    <option key={f.username} value={f.username}>
                      👤 {f.displayName} ({f.hunterCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours Presets */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  HẸN CHƠI SAU MẤY TIẾNG:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 6].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setSelectedHours(hrs)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '12px',
                        border: selectedHours === hrs ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: selectedHours === hrs ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                        color: selectedHours === hrs ? '#fbbf24' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Sau {hrs}h
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#fbbf24', textAlign: 'center' }}>
                  ⏰ Dự kiến bắt đầu:{' '}
                  <strong>{formatScheduledTime(now + selectedHours * 3600000)}</strong>
                </div>
              </div>

              {/* Select Tent / Table */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  CHỌN ĐỊA ĐIỂM (LỀU CẮM TRẠI):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    'Lều Bàn 1 (Hang Sói)',
                    'Lều Bàn 2 (Rừng Sương Mù)',
                    'Lều Bàn 3 (Đấu Trường Thợ Săn)',
                    'Lều Bàn 4 (Tháp Phù Thủy)',
                  ].map((tbl) => (
                    <button
                      key={tbl}
                      type="button"
                      onClick={() => setSelectedTable(tbl)}
                      style={{
                        padding: '10px 10px',
                        borderRadius: '12px',
                        border: selectedTable === tbl ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: selectedTable === tbl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                        color: selectedTable === tbl ? '#34d399' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Tent size={14} />
                      <span>{tbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Notes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  LỜI NHẮN:
                </label>
                <input
                  type="text"
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Ví dụ: Đúng giờ vào đông đủ nhé ae..."
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Success Message */}
              {scheduleSuccessMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{scheduleSuccessMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Sparkles size={18} />
                <span>Đặt Lịch Hẹn Ngay</span>
              </button>
            </form>
          )}

          {/* TAB 3: LỊCH ĐÃ HẸN & SERVICE WORKER NOTIFICATION */}
          {activeTab === 'matches' && (
            <div>
              {/* Notification Permission Card */}
              <div
                style={{
                  background:
                    notifPermission === 'granted'
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.25))'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(153, 27, 27, 0.25))',
                  border: `1px solid ${notifPermission === 'granted' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {notifPermission === 'granted' ? (
                    <BellRing size={22} color="#34d399" />
                  ) : (
                    <Bell size={22} color="#f87171" />
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>
                      {notifPermission === 'granted'
                        ? 'Đã Bật Thông Báo Trình Duyệt'
                        : 'Chưa Bật Thông Báo Trình Duyệt'}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {notifPermission === 'granted'
                        ? 'Hệ thống Service Worker sẽ tự động nhắc bạn trước 15 phút.'
                        : 'Bật thông báo để trình duyệt tự động nhảy pop-up trước giờ hẹn 15p!'}
                    </span>
                  </div>
                </div>

                {notifPermission === 'granted' ? (
                  <button
                    onClick={() => {
                      void notificationService.testNotification();
                      NativeBridge.hapticNotification('success');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    Test 15p
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    Bật Ngay
                  </button>
                )}
              </div>

              {/* Scheduled Matches List */}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                DANH SÁCH LỊCH HẸN ({matches.length})
              </span>

              {matches.length === 0 ? (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Clock size={32} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                    Chưa có lịch hẹn nào sắp tới. Bạn hãy qua tab <strong>+ Hẹn Giờ Chơi</strong> để tạo hẹn nhé!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {matches.map((m) => {
                    const diff = m.scheduledAt - now;
                    const isUpcoming15m = diff <= 15 * 60 * 1000 && diff > 0;
                    const isStarted = diff <= 0;

                    return (
                      <div
                        key={m.id}
                        style={{
                          background: isUpcoming15m
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.2))'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isUpcoming15m
                            ? '1.5px solid rgba(245, 158, 11, 0.6)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: isUpcoming15m ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Tent size={16} color={isUpcoming15m ? '#fbbf24' : '#60a5fa'} />
                              <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{m.tableName}</span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              Chủ phòng: <strong>{m.hostDisplayName}</strong>
                              {m.targetFriendDisplayName && ` • Mời: ${m.targetFriendDisplayName}`}
                            </span>
                          </div>

                          {/* Countdown Badge */}
                          <div
                            style={{
                              background: isStarted
                                ? '#10b981'
                                : isUpcoming15m
                                ? '#f59e0b'
                                : 'rgba(255, 255, 255, 0.08)',
                              color: '#fff',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                            }}
                          >
                            {formatMatchCountdown(m.scheduledAt, now)}
                          </div>
                        </div>

                        {m.notes && (
                          <div
                            style={{
                              fontSize: '0.76rem',
                              color: '#cbd5e1',
                              background: 'rgba(0, 0, 0, 0.2)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontStyle: 'italic',
                            }}
                          >
                            "{m.notes}"
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '6px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {formatScheduledTime(m.scheduledAt)}
                          </span>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {onJoinTable && (
                              <button
                                onClick={() => {
                                  onJoinTable(m.tableName);
                                  onClose();
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Play size={12} />
                                <span>Vào Lều Ngay</span>
                              </button>
                            )}

                            {m.hostUsername === currentUsername && (
                              <button
                                onClick={() => handleCancelMatch(m.id)}
                                style={{
                                  padding: '6px 8px',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  borderRadius: '8px',
                                  color: '#f87171',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Hủy hẹn
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
