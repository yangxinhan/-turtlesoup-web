let ws: WebSocket | null = null;

export const initWebSocket = () => {
  ws = new WebSocket('ws://localhost:3001');
  return ws;
};

export const sendWebSocketMessage = (type: string, data: any) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  } else {
    console.error('WebSocket 連接未建立或已關閉');
  }
};

export const getWebSocket = () => ws;
