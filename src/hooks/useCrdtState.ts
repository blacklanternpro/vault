import { useSyncExternalStore } from 'react';
import {
  EMPTY_SNAPSHOT,
  type NoteEntry,
  type SysLog,
  type TaskPriority,
  type VaultSnapshot,
  type WorkerRequest,
  type WorkerResponse,
} from '../lib/vault-types';

/**
 * Bridge between the UI and the CRDT engine running in sync.worker.ts.
 *
 * The worker is a module-level singleton: however many components call
 * useCrdtState(), they all read one snapshot and write through one worker.
 * useSyncExternalStore keeps every subscriber on the same render tick.
 */

let worker: Worker | null = null;
let snapshot: VaultSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function ensureWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('../workers/sync.worker.ts', import.meta.url), {
    type: 'module',
  });

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    if (event.data.type !== 'SNAPSHOT') return;
    snapshot = event.data.payload;
    for (const listener of listeners) listener();
  });

  worker.postMessage({ type: 'INIT' } satisfies WorkerRequest);
  return worker;
}

function send(request: WorkerRequest): void {
  ensureWorker().postMessage(request);
}

function subscribe(listener: () => void): () => void {
  ensureWorker();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): VaultSnapshot {
  return snapshot;
}

// Without this, each hot update leaves the previous worker alive and two
// Y.Docs race on the same IndexedDB database.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    worker?.terminate();
    worker = null;
    listeners.clear();
  });
}

// Stable identities: defined once at module scope so they never invalidate a
// dependency array or force a child re-render.
const actions = {
  addTask(task: {
    id: string;
    text: string;
    parentId: string | null;
    priority?: TaskPriority;
  }): void {
    send({ type: 'ADD_TASK', payload: task });
  },

  toggleTask(id: string): void {
    send({ type: 'TOGGLE_TASK', payload: { id } });
  },

  addNote(note: NoteEntry): void {
    send({ type: 'ADD_NOTE', payload: note });
  },

  /** Appending a log also marks the day, in a single CRDT transaction. */
  addSysLog(log: SysLog & { day: number }): void {
    send({ type: 'ADD_SYS_LOG', payload: log });
  },

  deleteSysLog(id: string): void {
    send({ type: 'DELETE_SYS_LOG', payload: { id } });
  },
};

export type VaultActions = typeof actions;

export function useCrdtState(): VaultSnapshot & VaultActions {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...state, ...actions };
}
