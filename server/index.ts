import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { RoomManager } from './roomManager';

const server = createServer();
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

// 添加心跳檢測
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  console.log('使用者連接');
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // 定期發送心跳
  const pingInterval = setInterval(() => {
    if (ws.isAlive === false) {
      console.log('連接已斷開');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('收到訊息:', data); // 添加日誌

      switch (data.type) {
        case 'CREATE_ROOM':
          const room = roomManager.createRoom(data.user);
          ws.send(JSON.stringify({ type: 'ROOM_UPDATE', room }));
          break;

        case 'JOIN_ROOM':
          try {
            if (!data.code) {
              throw new Error('房間代碼不能為空');
            }
            console.log('正在處理加入房間請求:', data);
            const joinedRoom = roomManager.joinRoom(data.code, data.user);
            
            const updateMessage = JSON.stringify({
              type: 'ROOM_UPDATE',
              room: joinedRoom
            });

            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(updateMessage);
              }
            });
          } catch (error) {
            console.error('加入房間失敗:', error); // 添加日誌
            ws.send(JSON.stringify({ 
              type: 'ERROR', 
              message: error instanceof Error ? error.message : '加入房間失敗'
            }));
          }
          break;

        case 'UPDATE_ROOM':
          const updatedRoom = roomManager.updateRoom(data.roomId, data.updates);
          if (updatedRoom) {
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ROOM_UPDATE', room: updatedRoom }));
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('處理訊息失敗:', error); // 添加日誌
      ws.send(JSON.stringify({ type: 'ERROR', message: '操作失敗，請稍後再試' }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket 錯誤:', error); // 添加錯誤處理
  });
});

// 每30秒清理已斷開的連接
const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket 伺服器運行在 port ${PORT}`);
});
