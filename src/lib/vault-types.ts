// Shared contract between the UI (main thread) and the CRDT engine
// (sync.worker.ts). Everything crossing postMessage must be structured-
// cloneable, so these are all plain JSON shapes.

export type TaskPriority = 'P1' | 'P2' | 'P3' | 'URGENT';

export interface TaskNode {
  id: string;
  text: string;
  priority?: TaskPriority;
  completed?: boolean;
  children: TaskNode[];
}

export interface NoteEntry {
  id: string;
  date: string;
  text: string;
  attachment?: string;
}

export interface SysLog {
  id: string;
  date: string;
  text: string;
  completed?: boolean;
}

/** The full materialized view the worker pushes to the UI on every change. */
export interface VaultSnapshot {
  tasks: TaskNode[];
  notes: NoteEntry[];
  sysLogs: SysLog[];
  markedDays: number[];
}

export type WorkerRequest =
  | { type: 'INIT' }
  | {
      type: 'ADD_TASK';
      payload: {
        id: string;
        text: string;
        parentId: string | null;
        priority?: TaskPriority;
      };
    }
  | { type: 'TOGGLE_TASK'; payload: { id: string } }
  | { type: 'ADD_NOTE'; payload: NoteEntry }
  | { type: 'ADD_SYS_LOG'; payload: SysLog & { day: number } }
  | { type: 'TOGGLE_SYS_LOG'; payload: { id: string } }
  | { type: 'DELETE_SYS_LOG'; payload: { id: string } };

export type WorkerResponse = { type: 'SNAPSHOT'; payload: VaultSnapshot };

export const EMPTY_SNAPSHOT: VaultSnapshot = {
  tasks: [],
  notes: [],
  sysLogs: [],
  markedDays: [],
};
