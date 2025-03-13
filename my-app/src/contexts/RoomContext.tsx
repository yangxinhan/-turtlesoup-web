'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Room, User } from '../types/game';

interface RoomContextType {
  room: Room | null;
  error: string | null;
  createRoom: (user: User) => Promise<void>;
  joinRoom: (code: string, user: User) => Promise<void>;
  leaveRoom: () => void;
  updateGameState: (updates: Partial<Room>) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setError('無法連接到伺服器，請重新整理頁面');
        return;
      }

      try {
        ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket 連接成功');
          setError(null);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'ROOM_UPDATE':
                setRoom(data.room);
                break;
              case 'ERROR':
                setError(data.message);
                break;
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          reconnectAttempts++;
          reconnectTimer = setTimeout(connect, 1000 * Math.min(reconnectAttempts, 5));
        };

      } catch (error) {
        console.error('WebSocket 連接錯誤:', error);
        reconnectTimer = setTimeout(connect, 1000 * Math.min(reconnectAttempts, 5));
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  const sendMessage = (type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    } else {
      setError('連接已斷開，請重新連接');
    }
  };

  const createRoom = async (user: User) => {
    sendMessage('CREATE_ROOM', { user });
  };

  const joinRoom = async (code: string, user: User) => {
    sendMessage('JOIN_ROOM', { code, user });
  };

  const leaveRoom = () => {
    sendMessage('LEAVE_ROOM', { roomId: room?.id });
    setRoom(null);
  };

  const updateGameState = (updates: Partial<Room>) => {
    sendMessage('UPDATE_ROOM', { roomId: room?.id, updates });
  };

  return (
    <RoomContext.Provider value={{
      room,
      error,
      createRoom,
      joinRoom,
      leaveRoom,
      updateGameState
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within RoomProvider');
  return context;
};
