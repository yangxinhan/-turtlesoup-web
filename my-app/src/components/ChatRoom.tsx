'use client'

import { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { useRoom } from '../contexts/RoomContext';
import { useAuth } from '../contexts/AuthContext';
import { RoleManager } from '../utils/roleManager';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'message' | 'question';
  answer?: 'correct' | 'incorrect';  // 添加答案狀態
}

interface ChatRoomProps {
  type: 'message' | 'question';
}

export default function ChatRoom({ type }: ChatRoomProps) {
  const { messages, addMessage } = useGameState();
  const { room, sendMessage } = useRoom();  // 使用 sendMessage
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !room || !user) return;
    
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      content: newMessage,
      sender: user.name || '未知用戶',
      timestamp: new Date().toLocaleTimeString(),
      type: type // 添加訊息類型
    };
    
    addMessage(message);
    setNewMessage('');
    sendMessage('CHAT_MESSAGE', { roomId: room.id, message });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col min-h-[300px]">
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {messages
          .filter(msg => msg.type === type) // 根據 type 過濾訊息
          .map((msg) => (
            <div 
              key={msg.id} 
              className={`rounded-lg p-2 ${
                msg.answer === 'correct' ? 'bg-green-100' : 
                msg.answer === 'incorrect' ? 'bg-red-100' : 
                'bg-gray-100'
              }`}
            >
              <p className="text-sm text-gray-800">{msg.content}</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{msg.sender}</span>
                <span>{msg.timestamp}</span>
              </div>
              {type === 'question' && user?.role === 'host' && !msg.answer && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      console.log('Sending answer:', {
                        roomId: room?.id,
                        questionId: msg.id,
                        answer: 'correct'
                      });
                      sendMessage('QUESTION_ANSWER', {
                        roomId: room?.id,
                        questionId: msg.id,
                        answer: 'correct'
                      });
                    }}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    正確
                  </button>
                  <button
                    onClick={() => {
                      console.log('Sending answer:', {
                        roomId: room?.id,
                        questionId: msg.id,
                        answer: 'incorrect'
                      });
                      sendMessage('QUESTION_ANSWER', {
                        roomId: room?.id,
                        questionId: msg.id,
                        answer: 'incorrect'
                      });
                    }}
                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    錯誤
                  </button>
                </div>
              )}
              {msg.answer && (
                <div className={`mt-1 text-xs font-medium ${
                  msg.answer === 'correct' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {msg.answer === 'correct' ? '✓ 正確' : '✗ 錯誤'}
                </div>
              )}
            </div>
          ))}
      </div>
      
      {/* 只有玩家和關主可以發送訊息 */}
      {user?.role !== 'spectator' && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              className="flex-grow border border-gray-300 rounded-md p-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入訊息..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
            >
              發送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
