'use client'

import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { useState } from 'react';
import HostPanel from './HostPanel';
import { GameState, Room } from '../types/game';
import ChatRoom from './ChatRoom';
import QuestionCard from './QuestionCard';

export default function GameClient() {
  const { user, login, isLoading } = useAuth();
  const { room, error, createRoom, joinRoom, leaveRoom, sendMessage } = useRoom();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [tempRoomCode, setTempRoomCode] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningRoomCode, setJoiningRoomCode] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [isComposingQuestion, setIsComposingQuestion] = useState(false);

  const handleCreateRoom = async () => {
    try {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setTempRoomCode(code);
    } catch (err) {
      console.error('創建房間失敗:', err);
    }
  };

  const handleConfirmJoin = async () => {
    try {
      if (nickname.trim()) {
        await login(nickname);
        if (user && tempRoomCode) {
          // 設定創建者為關主
          const hostUser = {
            ...user,
            name: nickname,
            isHost: true
          };
          await createRoom(hostUser);
          setTempRoomCode(null);
        }
      }
    } catch (err) {
      console.error('加入房間失敗:', err);
    }
  };

  const handleInitialJoin = () => {
    if (roomCode.length === 4) {
      setJoiningRoomCode(roomCode);
    }
  };

  const handleJoinRoom = async () => {
    try {
      if (nickname.trim() && joiningRoomCode) {
        await login(nickname);
        if (user) {
          setIsJoining(true);
          await joinRoom(joiningRoomCode, { ...user, name: nickname });
          setJoiningRoomCode(null);
        }
      }
    } catch (err) {
      console.error('加入房間失敗:', err);
      setError(err instanceof Error ? err.message : '加入房間失敗');
    } finally {
      setIsJoining(false);
    }
  };

  const handleQuestionSubmit = (question: string) => {
    if (!user || !room) return;
    
    const newQuestion = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: question,
      askedBy: user.name,
      timestamp: new Date().toLocaleTimeString()
    };

    sendMessage('CHAT_MESSAGE', { 
      roomId: room.id, 
      message: {
        ...newQuestion,
        type: 'question'
      }
    });

    // 清空輸入框
    const input = document.querySelector('input[placeholder="輸入問題..."]') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  const handleAnswerQuestion = (questionId: string, isCorrect: boolean) => {
    if (!room) return;
    
    const answer = isCorrect ? 'correct' : 'incorrect';
    sendMessage('QUESTION_ANSWER', {
      roomId: room.id,
      questionId,
      answer
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">登入海龜湯遊戲</h1>
          <input
            type="text"
            placeholder="輸入你的名字"
            className="border p-2 rounded w-full mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                login(e.currentTarget.value);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (tempRoomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">設定房間資訊</h1>
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-2">房間號碼</p>
            <p className="font-mono text-2xl font-bold text-blue-600">{tempRoomCode}</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入暱稱"
              className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleConfirmJoin}
              disabled={!nickname.trim()}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              確認並加入
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (joiningRoomCode) {
    return (
      <div className="min-h-screen flex items中心 justify-center bg-gray-100">
        <div className="bg白色 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">加入房間</h1>
          <div className="mb-6 text中心">
            <p className="text-gray-600 mb-2">房間號碼</p>
            <p className="font-mono text-2xl font-bold text-blue-600">{joiningRoomCode}</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入暱稱"
              className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!nickname.trim() || isJoining}
              className="w-full bg-blue-600 text白色 px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              {isJoining ? '加入中...' : '確認加入'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w全">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">海龜湯遊戲室</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              創建房間
            </button>
            <div className="space-y-2">
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="輸入房間代碼"
                className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleInitialJoin}
                disabled={roomCode.length !== 4}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
              >
                確認房間號碼
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">海龜湯遊戲室</h1>
          {room && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">房間號碼：</span>
                <span className="font-mono text-lg font-bold text-blue-600">{room.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">在線玩家：</span>
                <span className="text-gray-900">{room.players.length}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左側 - 當前題目區塊 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-gray-900">當前題目</h2>
              <div className="border-b pb-4 mb-4">
                <p className="text-lg text-gray-800">
                  {room?.gameState.status === 'playing' 
                    ? room.gameState.puzzle 
                    : '等待遊戲開始...'}
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">關主資訊</h3>
                  <p className="text-gray-700">關主：{room?.gameState.host?.name || '等待關主加入'}</p>
                </div>
                
                {/* 在線玩家列表移到這裡 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">在線玩家</h3>
                  <div className="space-y-2">
                    {room?.players.map((player) => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-white rounded"
                      >
                        <span className="text-gray-800">{player.name}</span>
                        {player.isHost && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">關主</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 關主回答區塊 */}
            {user?.isHost && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-xl font-bold mb-4 text-gray-900">問題回答</h3>
                <div className="space-y-4">
                  {room?.gameState.questions
                    .filter(q => !q.answer)
                    .map((q) => (
                      <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800 mb-2">{q.content}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{q.askedBy}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAnswerQuestion(q.id, true)}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              正確
                            </button>
                            <button
                              onClick={() => handleAnswerQuestion(q.id, false)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              錯誤
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* 中間 - 問題區塊 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-12rem)] flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-gray-900">問題</h2>
              <div className="flex-1">
                <ChatRoom type="question" />
              </div>
            </div>
          </div>

          {/* 右側 - 即時討論區塊 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-12rem)] flex flex-col">
              <h2 className="text-xl font-bold mb-4 text-gray-900">即時討論</h2>
              <div className="flex-1">
                <ChatRoom type="message" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
