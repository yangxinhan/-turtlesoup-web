export type UserRole = 'host' | 'player' | 'spectator';

export class RoleManager {
  static isHost(user: { isHost: boolean }): boolean {
    return user.isHost;
  }

  static getRole(user: { role?: UserRole; isHost?: boolean }): UserRole {
    if (user.isHost) {
      return 'host';
    }
    if (user.role) {
      return user.role;
    }
    return 'player';
  }

  static getRoleDisplay(role: UserRole): string {
    switch (role) {
      case 'host': return '關主';
      case 'player': return '玩家';
      case 'spectator': return '圍觀';
      default: return '玩家';
    }
  }

  static getRoleStyle(role: UserRole): string {
    switch (role) {
      case 'host':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'player':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'spectator':
        return 'bg-gray-100 text-gray-700 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  }
}
