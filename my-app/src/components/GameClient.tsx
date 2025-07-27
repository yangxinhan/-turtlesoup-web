'use client'

import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';
import { useState } from 'react';
import HostPanel from './HostPanel';
import { GameState, Room } from '../types/game';
import ChatRoom from './ChatRoom';
import QuestionCard from './QuestionCard';
import { RoleManager } from '../utils/roleManager';

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
  const [selectedRole, setSelectedRole] = useState<'host' | 'player' | 'spectator' | null>(null);

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
      if (nickname.trim() && selectedRole) {
        await login(nickname);
        if (user && tempRoomCode) {
          const newUser = {
            ...user,
            name: nickname,
            role: selectedRole,
            isHost: selectedRole === 'host'
          };
          await createRoom(newUser);
          setTempRoomCode(null);
        }
      }
    } catch (err) {
      console.error('創建房間失敗:', err);
    }
  };

  const handleInitialJoin = () => {
    if (roomCode.length === 4) {
      setJoiningRoomCode(roomCode);
    }
  };

  const handleJoinRoom = async () => {
    try {
      if (nickname.trim() && joiningRoomCode && selectedRole) {
        await login(nickname);
        if (user) {
          setIsJoining(true);
          const playerUser = {
            ...user,
            name: nickname,
            isHost: false,
            role: selectedRole
          };
          await joinRoom(joiningRoomCode, playerUser);
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
              className="w-full border border-gray-300 rounded-md p-3 text-gray-800 bg-white placeholder-gray-500"
            />
            
            {/* 新增角色選擇 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole('host')}
                className={`flex-1 p-3 rounded-md border ${
                  selectedRole === 'host' 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'border-gray-300'
                }`}
              >
                關主
              </button>
              <button
                onClick={() => setSelectedRole('player')}
                className={`flex-1 p-3 rounded-md border ${
                  selectedRole === 'player' 
                    ? 'bg-green-100 border-green-500' 
                    : 'border-gray-300'
                }`}
              >
                玩家
              </button>
              <button
                onClick={() => setSelectedRole('spectator')}
                className={`flex-1 p-3 rounded-md border ${
                  selectedRole === 'spectator' 
                    ? 'bg-gray-100 border-gray-500' 
                    : 'border-gray-300'
                }`}
              >
                圍觀
              </button>
            </div>

            <button
              onClick={handleConfirmJoin}
              disabled={!nickname.trim() || !selectedRole}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">加入房間</h1>
          <div className="mb-6 text中心">
            <p className="text-gray-600 mb-2">房間號碼：{joiningRoomCode}</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="輸入暱稱"
              className="w-full border rounded-md p-3 text-gray-800"
            />
            
            {/* 新增角色選擇 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole('host')}
                className={`flex-1 p-3 rounded-md border text-gray-800 ${
                  selectedRole === 'host' 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'border-gray-300 hover:bg-blue-50'
                }`}
              >
                關主
              </button>
              <button
                onClick={() => setSelectedRole('player')}
                className={`flex-1 p-3 rounded-md border text-gray-800 ${
                  selectedRole === 'player' 
                    ? 'bg-green-100 border-green-500' 
                    : 'border-gray-300 hover:bg-green-50'
                }`}
              >
                玩家
              </button>
              <button
                onClick={() => setSelectedRole('spectator')}
                className={`flex-1 p-3 rounded-md border text-gray-800 ${
                  selectedRole === 'spectator' 
                    ? 'bg-gray-100 border-gray-500' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                圍觀
              </button>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!nickname.trim() || !selectedRole || isJoining}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700"
            >
              {isJoining ? '加入中...' : '確認加入'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 在房間內顯示角色選擇
  if (room && !selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">選擇身份</h1>
          <div className="space-y-4">
            {/* 如果還沒有關主才顯示關主選項 */}
            {!room.players.some(p => p.isHost) && (
              <button
                onClick={() => {
                  sendMessage('UPDATE_ROLE', { 
                    roomId: room.id,
                    userId: user?.id,
                    role: 'host'
                  });
                  setSelectedRole('host');
                }}
                className="w-full p-4 bg-blue-100 text-blue-800 rounded-lg border-2 border-blue-200 hover:bg-blue-200"
              >
                關主
              </button>
            )}
            <button
              onClick={() => {
                sendMessage('UPDATE_ROLE', {
                  roomId: room.id,
                  userId: user?.id,
                  role: 'player'
                });
                setSelectedRole('player');
              }}
              className="w-full p-4 bg-green-100 text-green-800 rounded-lg border-2 border-green-200 hover:bg-green-200"
            >
              玩家
            </button>
            <button
              onClick={() => {
                sendMessage('UPDATE_ROLE', {
                  roomId: room.id,
                  userId: user?.id,
                  role: 'spectator'
                });
                setSelectedRole('spectator');
              }}
              className="w-full p-4 bg-gray-100 text-gray-800 rounded-lg border-2 border-gray-200 hover:bg-gray-200"
            >
              圍觀
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
              className="w-full bg-blue-600 text白色 px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
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
                className="w-full bg-green-600 text白色 px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
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
              <div className="flex items-center gap-2">
                <span className="text-gray-600">身份：</span>
                {room && user && (
                  <span className={`text-sm font-medium px-3 py-1.5 rounded-full shadow-sm ${
                    // 使用 find 查找當前使用者並根據其角色顯示樣式
                    room.players.find(p => p.id === user.id)?.role === 'host' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                    room.players.find(p => p.id === user.id)?.role === 'player' ? 'bg-green-100 text-green-800 border border-green-300' :
                    'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}>
                    {room.players.find(p => p.id === user.id)?.role === 'host' ? '關主' :
                    room.players.find(p => p.id === user.id)?.role === 'player' ? '玩家' :
                    '圍觀者'}
                  </span>
                )}
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
                  {room?.players.find(p => p.role === 'host') ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">關主：</span>
                      <span className="font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">
                        {room.players.find(p => p.role === 'host')?.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-700 italic">等待關主加入...</p>
                  )}
                </div>
                
                {/* 在線玩家列表移到這裡 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">在線玩家</h3>
                  <div className="space-y-2">
                    {room?.players.map((player) => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-2 bg白色 rounded"
                      >
                        <span className="text-gray-800">{player.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${RoleManager.getRoleStyle(player.role)}`}>
                          {RoleManager.getRoleDisplay(player.role)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 關主回答區塊 */}
            {user?.role === 'host' && (
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="text-xl font-bold mb-4 text-gray-900">未回答問題</h3>
                <div className="space-y-4">
                  {room?.gameState.questions
                    .filter(q => !q.answer)
                    .map((q) => (
                      <div key={q.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                        <p className="text-gray-800 mb-2 text-lg">{q.content}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">提問者：</span>
                            <span className="text-sm font-medium text-gray-800">{q.askedBy}</span>
                            <span className="text-xs text-gray-500">{q.timestamp}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAnswerQuestion(q.id, true)}
                              className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium shadow-sm"
                            >
                              正確
                            </button>
                            <button
                              onClick={() => handleAnswerQuestion(q.id, false)}
                              className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium shadow-sm"
                            >
                              錯誤
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {room?.gameState.questions.filter(q => !q.answer).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      目前沒有待回答的問題
                    </div>
                  )}
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
