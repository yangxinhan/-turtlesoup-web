import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { RoomManager } from './roomManager';

// 擴展 WebSocket 型別
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

const server = createServer();
const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

// 添加心跳檢測
function heartbeat(this: ExtendedWebSocket) {
  this.isAlive = true;
}

wss.on('connection', (ws: WebSocket) => {
  const extWs = ws as ExtendedWebSocket;
  console.log('使用者連接');
  
  extWs.isAlive = true;
  extWs.on('pong', heartbeat);

  // 定期發送心跳
  const pingInterval = setInterval(() => {
    if (extWs.isAlive === false) {
      console.log('連接已斷開');
      return extWs.terminate();
    }
    extWs.isAlive = false;
    extWs.ping();
  }, 30000);

  extWs.on('close', () => {
    clearInterval(pingInterval);
  });

  extWs.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('收到 WebSocket 訊息:', data);

      switch (data.type) {
        case 'CREATE_ROOM':
          const newRoom = roomManager.createRoom(data.user);
          extWs.send(JSON.stringify({ type: 'ROOM_UPDATE', room: newRoom }));
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
            extWs.send(JSON.stringify({ 
              type: 'ERROR', 
              message: error instanceof Error ? error.message : '加入房間失敗'
            }));
          }
          break;

        case 'UPDATE_ROOM':
          const roomUpdate = roomManager.updateRoom(data.roomId, data.updates);
          if (roomUpdate) {
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'ROOM_UPDATE', room: roomUpdate }));
              }
            });
          }
          break;

        case 'CHAT_MESSAGE':
          if (data.message.type === 'question') {
            // 廣播問題給所有客戶端
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'CHAT_MESSAGE',
                  roomId: data.roomId,
                  message: data.message
                }));
              }
            });

            // 更新房間狀態
            const room = roomManager.getRoomById(data.roomId);
            if (room) {
              room.gameState.questions.push({
                id: data.message.id,
                content: data.message.content,
                askedBy: data.message.sender,
                timestamp: data.message.timestamp,
                answer: null
              });
              
              // 廣播更新後的房間狀態
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'ROOM_UPDATE',
                    room
                  }));
                }
              });
            }
          } else {
            // 一般聊天訊息處理
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'CHAT_MESSAGE',
                  roomId: data.roomId,
                  message: data.message
                }));
              }
            });
          }
          break;

        case 'QUESTION_ANSWER':
          const { roomId, questionId, answer } = data;
          // 廣播答案狀態給所有客戶端
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'CHAT_MESSAGE',
                roomId,
                questionId,
                answer
              }));
            }
          });
          break;
      }
    } catch (error) {
      console.error('處理訊息失敗:', error); // 添加日誌
      extWs.send(JSON.stringify({ type: 'ERROR', message: '操作失敗，請稍後再試' }));
    }
  });

  extWs.on('error', (error) => {
    console.error('WebSocket 錯誤:', error); // 添加錯誤處理
  });
});

// 每30秒清理已斷開的連接
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtendedWebSocket;
    if (extWs.isAlive === false) return extWs.terminate();
    extWs.isAlive = false;
    extWs.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket 伺服器運行在 port ${PORT}`);
});
