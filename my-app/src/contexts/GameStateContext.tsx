'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import { GameState, Question } from '../types/game';
import { useRoom } from './RoomContext';

interface GameStateContextType {
  currentPuzzle: string;
  questions: Question[];
  messages: Message[];
  addQuestion: (question: Question) => void;
  addMessage: (message: Message) => void;
  updatePuzzle: (puzzle: string) => void;
}

// 將介面提升到頂層以共用
export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'message' | 'question';  // 添加 type 欄位
  answer?: 'correct' | 'incorrect';  // 添加 answer 欄位
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [currentPuzzle, setCurrentPuzzle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { room, getWebSocket } = useRoom();

  useEffect(() => {
    if (room?.gameState) {
      setCurrentPuzzle(room.gameState.puzzle);
      setQuestions(room.gameState.questions);
    }
  }, [room?.gameState]);

  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE') {
          // 更新訊息的 answer 屬性
          if (data.questionId && data.answer) {
            setMessages(prev => prev.map(msg => 
              msg.id === data.questionId 
                ? { ...msg, answer: data.answer }
                : msg
            ));
          } else {
            addMessage(data.message);
          }
        }
      } catch (err) {
        console.error('處理WebSocket訊息錯誤:', err);
      }
    };

    const ws = getWebSocket();
    if (ws) {
      ws.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [room?.id, getWebSocket]);

  const addQuestion = (question: Question) => {
    setQuestions(prev => [...prev, question]);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => {
      // 檢查訊息是否已經存在
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const updatePuzzle = (puzzle: string) => {
    setCurrentPuzzle(puzzle);
  };

  return (
    <GameStateContext.Provider value={{
      currentPuzzle,
      questions,
      messages,
      addQuestion,
      addMessage,
      updatePuzzle
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within GameStateProvider');
  return context;
};
