export class ConnectionLimiter {
  private readonly maxUsers: number;
  private readonly activeConnections = new Set<string>();

  constructor(maxUsers: number) {
    this.maxUsers = maxUsers;
  }

  tryAdd(id: string): boolean {
    if (this.activeConnections.has(id)) {
      return true;
    }
    if (this.activeConnections.size >= this.maxUsers) {
      return false;
    }
    this.activeConnections.add(id);
    return true;
  }

  remove(id: string): void {
    this.activeConnections.delete(id);
  }

  count(): number {
    return this.activeConnections.size;
  }

  getMaxUsers(): number {
    return this.maxUsers;
  }

  isFull(): boolean {
    return this.activeConnections.size >= this.maxUsers;
  }
}
