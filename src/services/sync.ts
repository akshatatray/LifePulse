/**
 * Sync Manager
 * Handles offline-first sync between local storage and Firestore
 * 
 * Strategy:
 * 1. All writes go to local storage first (instant UI update)
 * 2. Changes are queued for sync
 * 3. When online, queue is processed
 * 4. On conflict, local changes win (user's latest action)
 */

import { storage, STORAGE_KEYS } from '../utils/storage';
import { habitService, logService } from './firestore';
import { Habit, HabitLog } from '../types/habit';
import NetInfo from '@react-native-community/netinfo';

// Sync operation types
type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: 'habit' | 'log';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncState {
  queue: SyncOperation[];
  lastSyncAt: number | null;
  isSyncing: boolean;
}

// Max retries before dropping an operation
const MAX_RETRIES = 3;

// Sync manager singleton
class SyncManager {
  private state: SyncState = {
    queue: [],
    lastSyncAt: null,
    isSyncing: false,
  };
  
  private userId: string | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;

  /**
   * Initialize the sync manager
   */
  async init(userId: string): Promise<void> {
    this.userId = userId;
    
    // Load persisted queue
    const savedQueue = await storage.get<SyncOperation[]>(STORAGE_KEYS.SYNC_QUEUE);
    if (savedQueue) {
      this.state.queue = savedQueue;
    }
    
    const lastSync = await storage.get<number>(STORAGE_KEYS.LAST_SYNC);
    if (lastSync) {
      this.state.lastSyncAt = lastSync;
    }
    
    // Listen for network changes
    // Process queue when connected and internet is reachable (or null = unknown/checking)
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.processQueue();
      }
    });
    
    // Try to sync on init
    this.processQueue();
  }

  /**
   * Cleanup when user logs out
   */
  cleanup(): void {
    this.userId = null;
    this.state = { queue: [], lastSyncAt: null, isSyncing: false };
    this.unsubscribeNetInfo?.();
    this.unsubscribeNetInfo = null;
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Check if we're online (sync helper)
   */
  private async isOnline(): Promise<boolean> {
    const netState = await NetInfo.fetch();
    return netState.isConnected === true && netState.isInternetReachable !== false;
  }

  /**
   * Add operation to sync queue
   * If online, tries to execute immediately without queuing
   */
  async queueOperation(
    type: SyncOperationType,
    entity: 'habit' | 'log',
    data: any
  ): Promise<void> {
    const operation: SyncOperation = {
      id: `${entity}-${data.id}-${Date.now()}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    // If we have a userId and are online, try to execute immediately
    if (this.userId && !this.state.isSyncing) {
      const online = await this.isOnline();
      if (online) {
        try {
          await this.executeOperation(operation);
          console.log(`[Sync] Direct: ${operation.type} ${operation.entity} ${operation.data.id}`);
          return; // Success! No need to queue
        } catch (error) {
          console.log(`[Sync] Direct write failed, queuing:`, error);
          // Fall through to queue the operation
        }
      }
    }
    
    // Remove any existing operations for the same entity+id
    // (user's latest action should win)
    this.state.queue = this.state.queue.filter(
      (op) => !(op.entity === entity && op.data.id === data.id)
    );
    
    // Add new operation
    this.state.queue.push(operation);
    
    // Persist queue
    await storage.set(STORAGE_KEYS.SYNC_QUEUE, this.state.queue);
    
    this.notifyListeners();
    
    // Try to sync immediately
    this.processQueue();
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    // Check if we can sync
    if (this.state.isSyncing || !this.userId || this.state.queue.length === 0) {
      return;
    }
    
    // Check network - only treat explicit false as offline
    // isInternetReachable can be null initially while checking
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) {
      console.log('[Sync] Offline - queue will be processed when online');
      return;
    }
    
    this.state.isSyncing = true;
    this.notifyListeners();
    
    console.log(`[Sync] Processing ${this.state.queue.length} operations...`);
    
    const failedOperations: SyncOperation[] = [];
    
    for (const operation of this.state.queue) {
      try {
        await this.executeOperation(operation);
        console.log(`[Sync] ✓ ${operation.type} ${operation.entity} ${operation.data.id}`);
      } catch (error) {
        console.error(`[Sync] ✗ ${operation.type} ${operation.entity}:`, error);
        
        operation.retryCount++;
        
        if (operation.retryCount < MAX_RETRIES) {
          failedOperations.push(operation);
        } else {
          console.error(`[Sync] Dropping operation after ${MAX_RETRIES} retries:`, operation);
        }
      }
    }
    
    // Update queue with failed operations
    this.state.queue = failedOperations;
    this.state.lastSyncAt = Date.now();
    this.state.isSyncing = false;
    
    // Persist updated state
    await storage.set(STORAGE_KEYS.SYNC_QUEUE, this.state.queue);
    await storage.set(STORAGE_KEYS.LAST_SYNC, this.state.lastSyncAt);
    
    this.notifyListeners();
    
    console.log(`[Sync] Complete. ${failedOperations.length} operations remaining.`);
  }

  /**
   * Execute a single sync operation
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    if (!this.userId) throw new Error('No user ID');
    
    const { type, entity, data } = operation;
    
    if (entity === 'habit') {
      switch (type) {
        case 'CREATE':
          await habitService.create(this.userId, data);
          break;
        case 'UPDATE':
          await habitService.update(this.userId, data.id, data);
          break;
        case 'DELETE':
          await habitService.delete(this.userId, data.id);
          break;
      }
    } else if (entity === 'log') {
      switch (type) {
        case 'CREATE':
        case 'UPDATE':
          await logService.upsert(this.userId, data);
          break;
        case 'DELETE':
          await logService.delete(this.userId, data.id);
          break;
      }
    }
  }

  /**
   * Force a full sync from server
   */
  async fullSync(): Promise<{ habits: Habit[]; logs: HabitLog[] } | null> {
    if (!this.userId) return null;
    
    // Only treat explicit false as offline
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || netState.isInternetReachable === false) {
      return null;
    }
    
    try {
      this.state.isSyncing = true;
      this.notifyListeners();
      
      // First, push any pending local changes
      await this.processQueue();
      
      // Then pull from server
      const [habits, logs] = await Promise.all([
        habitService.getAll(this.userId),
        logService.getAll(this.userId),
      ]);
      
      this.state.lastSyncAt = Date.now();
      await storage.set(STORAGE_KEYS.LAST_SYNC, this.state.lastSyncAt);
      
      return { habits, logs };
    } catch (error) {
      console.error('[Sync] Full sync failed:', error);
      throw error;
    } finally {
      this.state.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Get pending operation count
   */
  getPendingCount(): number {
    return this.state.queue.length;
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.state.isSyncing;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

