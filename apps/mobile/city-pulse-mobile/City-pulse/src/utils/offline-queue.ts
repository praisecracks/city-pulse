import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { apiRequest } from './api-client';

const QUEUE_KEY = '@citypulse:offlineQueue';

export type QueuedRequest = {
  path: string;
  method: string;
  body?: unknown;
  token: string | null;
};

type StoredEntry = QueuedRequest & { id: string; createdAt: number };

async function loadQueue(): Promise<StoredEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as StoredEntry[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: StoredEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // best-effort
  }
}

export async function enqueueRequest(req: QueuedRequest): Promise<void> {
  const queue = await loadQueue();
  queue.push({ ...req, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: Date.now() });
  await saveQueue(queue);
}

export async function getPendingCount(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

export async function flushQueue(): Promise<{ flushed: number; remaining: number }> {
  const queue = await loadQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0 };

  let flushed = 0;
  const remaining: StoredEntry[] = [];

  for (const entry of queue) {
    try {
      await apiRequest(entry.path, {
        method: entry.method,
        body: entry.body,
        token: entry.token,
      });
      flushed++;
    } catch {
      // Keep queued if still offline; drop if server rejected (non-offline).
      // We re-check connectivity by attempting; on failure we keep it queued
      // so the next reconnect retries. To avoid infinite loops on hard
      // failures, cap retries by age (24h).
      const age = Date.now() - entry.createdAt;
      if (age < 24 * 60 * 60 * 1000) {
        remaining.push(entry);
      }
    }
  }

  await saveQueue(remaining);
  return { flushed, remaining: remaining.length };
}

export function clearQueue(): Promise<void> {
  return AsyncStorage.removeItem(QUEUE_KEY).catch(() => {});
}

let listener: (() => void) | null = null;

export function startOfflineQueueListener(): () => void {
  if (listener) return listener;
  let wasOffline = false;
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected === false) {
      wasOffline = true;
    } else if (state.isConnected === true && wasOffline) {
      wasOffline = false;
      void flushQueue();
    }
  });
  listener = () => {
    unsubscribe();
    listener = null;
  };
  return listener;
}