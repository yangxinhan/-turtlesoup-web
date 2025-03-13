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
    console.log('嘗試加入房間，房間代碼:', code);
    console.log('當前所有房間:', [...this.rooms.values()].map(r => r.code));

    const room = [...this.rooms.values()].find(r => r.code === code);
    
    if (!room) {
      console.log('找不到房間:', code);
      throw new Error('找不到此房間');
    }

    console.log('找到房間:', room);
    
    const newPlayer = {
      id: Date.now().toString(),
      name: user.name.trim(),
      isHost: false
    };

    room.players.push(newPlayer);
    room.gameState.players.push(newPlayer);

    console.log('加入後的房間狀態:', room);
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
}
