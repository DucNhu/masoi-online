import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../src/logic/roomManager.ts';
import { voiceEngine, WebRTCVoiceEngine } from '../src/logic/webrtcVoiceMesh.ts';
import { maskGameStateForPlayer } from '../src/logic/roomProtocol.ts';

test('Sprint 17 - TASK-1601: WebRTCVoiceEngine headless safety and lifecycle', async () => {
  const engine = new WebRTCVoiceEngine();
  assert.equal(engine.getIsMicEnabled(), false);
  assert.equal(engine.getLocalStream(), null);

  // Trong Node.js headless, enableMicrophone phải báo lỗi rõ ràng hoặc xử lý an toàn không crash
  await assert.rejects(
    async () => {
      await engine.enableMicrophone();
    },
    /Thiết bị hoặc trình duyệt không hỗ trợ Web Audio \/ Microphone/
  );

  // Bật/tắt trạng thái mic
  engine.setMicEnabled(true);
  assert.equal(engine.getIsMicEnabled(), true);

  engine.setMicEnabled(false);
  assert.equal(engine.getIsMicEnabled(), false);

  // Gọi unlockAudio và destroy không ném lỗi
  engine.unlockAudio();
  engine.destroy();
  assert.equal(engine.getIsMicEnabled(), false);
});

test('Sprint 17 - TASK-1602: Werewolf game audio rules (Night Auto-Mute & Dead Silence)', () => {
  const engine = new WebRTCVoiceEngine();
  engine.setMicEnabled(true);

  const players = [
    { id: 'p_wolf_1', role: 'WEREWOLF', isAlive: true },
    { id: 'p_wolf_2', role: 'WEREWOLF', isAlive: true },
    { id: 'p_villager', role: 'VILLAGER', isAlive: true },
    { id: 'p_dead', role: 'VILLAGER', isAlive: false },
  ];

  // 1. Ban đêm, người chơi là Dân Làng -> Tự động khóa mic (Night Auto-Mute)
  engine.applyGameAudioRules({
    isNight: true,
    myRole: 'VILLAGER',
    isAlive: true,
    players,
  });
  assert.equal(engine.getIsMicEnabled(), false, 'Dân làng phải bị tự động khóa mic ban đêm');

  // 2. Ban đêm, người chơi là Ma Sói -> Mic được phép mở
  engine.setMicEnabled(true);
  engine.applyGameAudioRules({
    isNight: true,
    myRole: 'WEREWOLF',
    isAlive: true,
    players,
  });
  assert.equal(engine.getIsMicEnabled(), true, 'Ma Sói được phép mở mic bàn luận ban đêm');

  // 3. Người chơi đã chết -> Tự động khóa mic
  engine.applyGameAudioRules({
    isNight: false,
    myRole: 'VILLAGER',
    isAlive: false,
    players,
  });
  assert.equal(engine.getIsMicEnabled(), false, 'Người chết phải bị khóa mic');

  engine.destroy();
});

test('Sprint 17 - TASK-1603: RoomManager voice broadcast and SET_VOICE_STATE P2P synchronization', async () => {
  const rm = new RoomManager();
  const roomRes = rm.createRoom('Chủ Tọa Đàm Thoại', '👑');
  const roomId = roomRes.roomId.toUpperCase();
  const hostId = roomRes.playerId;

  // Kiểm tra host player có peerId hợp lệ
  const hostState = rm.getMaskedState(roomId, hostId);
  const hostPlayer = hostState.players.find((p) => p.id === hostId);
  assert.ok(hostPlayer?.peerId);
  assert.equal(hostPlayer?.peerId, `masoi-v1-${roomId}`);

  // Cập nhật trạng thái voice
  rm.setVoiceState(roomId, hostId, true, false);
  const stateAfterVoice = rm.getMaskedState(roomId, hostId);
  const updatedHost = stateAfterVoice.players.find((p) => p.id === hostId);
  assert.equal(updatedHost?.isSpeaking, true);
  assert.equal(updatedHost?.isMuted, false);

  // Tắt mic
  rm.stopVoiceBroadcast(roomId, hostId);
  const stateAfterMute = rm.getMaskedState(roomId, hostId);
  const mutedHost = stateAfterMute.players.find((p) => p.id === hostId);
  assert.equal(mutedHost?.isMuted, true);
  assert.equal(mutedHost?.isSpeaking, false);

  rm.leaveRoom(roomId, hostId);
});

test('Sprint 17 - TASK-1604: Zero-Knowledge state masking preserves player peerId for voice mesh', () => {
  const serverState = {
    roomId: 'ROOM88',
    phase: 'DAY_DISCUSSION',
    settings: {
      maxPlayers: 8,
      discussionTimeSeconds: 60,
      votingTimeSeconds: 30,
      allowExpansionRoles: false,
      activeExpansionRoles: [],
      isPrivate: false,
    },
    dayNumber: 1,
    timerSeconds: 60,
    mayorPlayerId: null,
    players: [
      {
        id: 'p_1',
        name: 'Player 1',
        avatar: '🐺',
        isHost: true,
        isReady: true,
        isAlive: true,
        seatNumber: 1,
        hasVoted: false,
        hasActedNight: false,
        role: 'WEREWOLF',
        sessionToken: 'secret_1',
        peerId: 'masoi-v1-ROOM88',
      },
      {
        id: 'p_2',
        name: 'Player 2',
        avatar: '👤',
        isHost: false,
        isReady: true,
        isAlive: true,
        seatNumber: 2,
        hasVoted: false,
        hasActedNight: false,
        role: 'VILLAGER',
        sessionToken: 'secret_2',
        peerId: 'peer_client_p2',
      },
    ],
    nightActions: {
      protectedPlayerId: null,
      werewolfTargetId: null,
      witchSaved: false,
      witchPoisonTargetId: null,
      seerTargetId: null,
    },
    votes: {},
    chatMessages: [],
    historyLog: [],
    winner: null,
    spectators: [],
    liveCheers: [],
  };

  const masked = maskGameStateForPlayer(serverState, 'p_2');
  assert.equal(masked.players.length, 2);

  // peerId phải được giữ lại cho WebRTC Mesh
  assert.equal(masked.players[0].peerId, 'masoi-v1-ROOM88');
  assert.equal(masked.players[1].peerId, 'peer_client_p2');

  // Nhưng sessionToken và role thật của p_1 phải bị che giấu tuyệt đối (Zero-Knowledge)
  assert.equal(masked.players[0].sessionToken, undefined);
  assert.equal(masked.players[0].role, undefined);
});

