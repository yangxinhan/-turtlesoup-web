import { Room, User, Question } from '../my-app/src/types/game';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private usedCodes: Set<string> = new Set();

  generateRoomCode(): string {
    let code: string;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.usedCodes.has(code));
    
    this.usedCodes.add(code);
    return code;
  }

  createRoom(host: User): Room {
    const code = this.generateRoomCode();
    // 確保 host.isHost 為 true
    const hostUser = {
      ...host,
      isHost: true
    };
    
    const room: Room = {
      id: Date.now().toString(),
      code,
      host: hostUser,
      players: [hostUser],
      gameState: {
        id: '1',
        title: '',
        puzzle: '',
        solution: '',
        status: 'waiting',
        host: hostUser,
        players: [hostUser],
        questions: []
      }
    };
    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(code: string, user: User): Room {
    const room = [...this.rooms.values()].find(r => r.code === code);
    
    if (!room) {
      throw new Error('找不到此房間');
    }
    
    const newPlayer = {
      ...user,
      id: Date.now().toString(),
      name: user.name.trim(),
      role: user.role, // 保持原有的角色設定
      isHost: user.role === 'host' // 根據角色設定 isHost
    };

    room.players.push(newPlayer);
    if (newPlayer.isHost) {
      room.host = newPlayer;
    }
    room.gameState.players.push(newPlayer);

    return room;
  }

  updateRoom(roomId: string, updates: Partial<Room>): Room | null {
    const room = this.rooms.get(roomId);
    if (room) {
      Object.assign(room, updates);
      return room;
    }
    return null;
  }

  getRoomById(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      return room;
    }
    return undefined;
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      this.usedCodes.delete(room.code);
      this.rooms.delete(roomId);
    }
  }

  answerQuestion(roomId: string, questionId: string, answer: 'correct' | 'incorrect'): Room | null {
    const room = this.rooms.get(roomId);
    if (room) {
      const question = room.gameState.questions.find(q => q.id === questionId);
      if (question) {
        question.answer = answer;
      }
      return room;
    }
    return null;
  }

  updateUserRole(roomId: string, userId: string, isHost: boolean): Room | null {
    const room = this.rooms.get(roomId);
    if (room) {
      const player = room.players.find(p => p.id === userId);
      if (player) {
        player.isHost = isHost;
        if (isHost) {
          room.host = player;
          room.gameState.host = player;
        }
      }
      return room;
    }
    return null;
  }
}
