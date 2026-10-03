import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface RoomSyncBody {
  room: {
    roomId: string;
    [key: string]: unknown;
  };
}

/**
 * Vite Dev & Preview Server Plugin: Realtime Room Relay Server
 * Đồng bộ hóa dữ liệu phòng chơi và thời gian thực (SSE) giữa các trình duyệt khác nhau
 * (Safari, Chrome thường, Chrome ẩn danh, Mobile Safari/Chrome).
 */
export function werewolfRoomServerPlugin(): Plugin {
  // Bộ nhớ đệm phòng chơi tập trung trên Node.js server
  const sharedRooms = new Map<string, any>();
  // Danh sách các kết nối SSE đang lắng nghe theo roomId
  const sseRoomSubscribers = new Map<string, Set<ServerResponse>>();
  // Danh sách kết nối SSE lắng nghe danh sách bàn chơi (Lobby)
  const sseLobbySubscribers = new Set<ServerResponse>();

  function readJsonBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : ({} as T));
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });
  }

  function broadcastRoomUpdate(roomId: string, room: any) {
    const subscribers = sseRoomSubscribers.get(roomId);
    if (subscribers && subscribers.size > 0) {
      const payload = `data: ${JSON.stringify({ type: 'ROOM_UPDATE', roomId, room })}\n\n`;
      for (const res of subscribers) {
        try {
          res.write(payload);
        } catch {
          subscribers.delete(res);
        }
      }
    }

    // Thông báo cho Lobby có thay đổi bàn chơi
    if (sseLobbySubscribers.size > 0) {
      const lobbyPayload = `data: ${JSON.stringify({ type: 'LOBBY_CHANGED', roomId })}\n\n`;
      for (const res of sseLobbySubscribers) {
        try {
          res.write(lobbyPayload);
        } catch {
          sseLobbySubscribers.delete(res);
        }
      }
    }
  }

  function handleApiRequest(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const url = req.url || '';
    if (!url.startsWith('/api/werewolf/')) {
      return next();
    }

    // CORS & Common Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const cleanPath = url.split('?')[0];

    // 1. GET /api/werewolf/rooms — Lấy danh sách tất cả các phòng hiện có trên server
    if (cleanPath === '/api/werewolf/rooms' && req.method === 'GET') {
      const roomsList = Array.from(sharedRooms.values());
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, rooms: roomsList }));
      return;
    }

    // 2. POST /api/werewolf/rooms/sync — Đồng bộ hoặc cập nhật trạng thái phòng từ bất kỳ client nào
    if (cleanPath === '/api/werewolf/rooms/sync' && req.method === 'POST') {
      readJsonBody<RoomSyncBody>(req)
        .then((body) => {
          if (!body?.room?.roomId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, error: 'Thiếu dữ liệu roomId' }));
            return;
          }

          const roomId = body.room.roomId.toUpperCase();
          sharedRooms.set(roomId, body.room);
          broadcastRoomUpdate(roomId, body.room);

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, roomId }));
        })
        .catch((err) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: String(err) }));
        });
      return;
    }

    // 3. GET /api/werewolf/rooms/events — SSE Stream theo dõi trạng thái phòng
    if (cleanPath === '/api/werewolf/rooms/events' && req.method === 'GET') {
      const urlObj = new URL(url, 'http://localhost');
      const roomId = (urlObj.searchParams.get('roomId') || '').toUpperCase();

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      });

      res.write(`data: ${JSON.stringify({ type: 'CONNECTED', roomId })}\n\n`);

      if (roomId) {
        if (!sseRoomSubscribers.has(roomId)) {
          sseRoomSubscribers.set(roomId, new Set());
        }
        sseRoomSubscribers.get(roomId)!.add(res);

        // Gửi ngay trạng thái hiện tại nếu phòng đã có trên server
        const currentRoom = sharedRooms.get(roomId);
        if (currentRoom) {
          res.write(`data: ${JSON.stringify({ type: 'ROOM_UPDATE', roomId, room: currentRoom })}\n\n`);
        }

        req.on('close', () => {
          const subs = sseRoomSubscribers.get(roomId);
          if (subs) {
            subs.delete(res);
            if (subs.size === 0) sseRoomSubscribers.delete(roomId);
          }
        });
      } else {
        // Lắng nghe Lobby
        sseLobbySubscribers.add(res);
        req.on('close', () => {
          sseLobbySubscribers.delete(res);
        });
      }
      return;
    }

    // 4. GET /api/werewolf/rooms/:roomId — Lấy chi tiết một phòng cụ thể
    const singleRoomMatch = cleanPath.match(/^\/api\/werewolf\/rooms\/([A-Za-z0-9_-]+)$/);
    if (singleRoomMatch && req.method === 'GET') {
      const roomId = singleRoomMatch[1].toUpperCase();
      const room = sharedRooms.get(roomId);

      res.setHeader('Content-Type', 'application/json');
      if (room) {
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, room }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Phòng không tồn tại trên máy chủ' }));
      }
      return;
    }

    next();
  }

  return {
    name: 'werewolf-room-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handleApiRequest);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handleApiRequest);
    },
  };
}
