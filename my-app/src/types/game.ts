export interface User {
  id: string;
  name: string;
  isHost: boolean;
}

export interface GameState {
  id: string;
  title: string;
  puzzle: string;
  solution: string;
  status: 'waiting' | 'playing' | 'ended';
  host: User;
  players: User[];
  questions: Question[];
}

export interface Question {
  id: string;
  content: string;
  askedBy: User;
  answer?: string;
  timestamp: string;
}

export interface Room {
  id: string;
  code: string;
  host: User;
  players: User[];
  gameState: GameState;
}
