'use client'

import { useState } from 'react';
import { GameState } from '../types/game';

interface HostPanelProps {
  gameState: GameState;
  onUpdateGame: (updates: Partial<GameState>) => void;
}

export default function HostPanel({ gameState, onUpdateGame }: HostPanelProps) {
  const [newPuzzle, setNewPuzzle] = useState('');
  const [solution, setSolution] = useState('');

  const handleStartGame = () => {
    if (!newPuzzle || !solution) return;
    
    onUpdateGame({
      puzzle: newPuzzle,
      solution,
      status: 'playing'
    });
  };

  const handleEndGame = () => {
    onUpdateGame({
      status: 'ended'
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">關主控制面板</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">題目</label>
          <textarea
            className="w-full border rounded p-2"
            value={newPuzzle}
            onChange={(e) => setNewPuzzle(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-2">解答</label>
          <textarea
            className="w-full border rounded p-2"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStartGame}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={gameState.status === 'playing'}
          >
            開始遊戲
          </button>
          <button
            onClick={handleEndGame}
            className="bg-red-500 text-white px-4 py-2 rounded"
            disabled={gameState.status !== 'playing'}
          >
            結束遊戲
          </button>
        </div>
      </div>
    </div>
  );
}
