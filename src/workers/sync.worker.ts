import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type {
  NoteEntry,
  SysLog,
  TaskNode,
  TaskPriority,
  VaultSnapshot,
  WorkerRequest,
  WorkerResponse,
} from '../lib/vault-types';

/**
 * The CRDT engine. Owns the Y.Doc and its IndexedDB persistence so that all
 * document work (merging updates, rebuilding the task tree, writing to disk)
 * happens off the main thread. The UI never touches Yjs directly -- it sends
 * intent messages in and receives plain JSON snapshots back.
 */

const ctx = self as unknown as {
  postMessage(message: WorkerResponse): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
};

const DOC_NAME = 'tui-os-vault';
/** Bump to wipe legacy demo seeds and install the current OS seed. */
const SEED_VERSION = 3;

const doc = new Y.Doc();

/**
 * Tasks are stored flat (id -> node) with a `parentId` pointer rather than as
 * nested Y.Arrays. Flat storage keeps every task independently mergeable:
 * two peers editing different branches never touch the same CRDT structure.
 * The tree is rebuilt on read.
 */
const yTasks = doc.getMap<Y.Map<unknown>>('tasks');
const yNotes = doc.getArray<Y.Map<unknown>>('notes');
const ySysLogs = doc.getArray<Y.Map<unknown>>('sysLogs');
/** Set semantics: day number -> true. Marking the same day twice is a no-op. */
const yMarkedDays = doc.getMap<boolean>('markedDays');
const yMeta = doc.getMap<number | boolean>('meta');

// ---------------------------------------------------------------------------
// SEED — lean OS tree, 3 levels deep. No calendar/notes demo fluff.
// ---------------------------------------------------------------------------

interface SeedTask {
  id: string;
  text: string;
  priority?: TaskPriority;
  completed?: boolean;
  children: SeedTask[];
}

const SEED_TASKS: SeedTask[] = [
  {
    id: 'v3-ops',
    text: 'ops/',
    priority: 'URGENT',
    children: [
      {
        id: 'v3-ops-net',
        text: 'net/',
        children: [
          { id: 'v3-ops-net-dns', text: 'flush_stale_resolvers.sh', children: [] },
          { id: 'v3-ops-net-wg', text: 'wireguard_peer_audit', children: [] },
        ],
      },
      {
        id: 'v3-ops-pwr',
        text: 'power/',
        children: [
          { id: 'v3-ops-pwr-ups', text: 'ups_runtime_check', children: [] },
        ],
      },
    ],
  },
  {
    id: 'v3-lab',
    text: 'lab/',
    priority: 'P1',
    children: [
      {
        id: 'v3-lab-chem',
        text: 'chem/',
        children: [
          { id: 'v3-lab-chem-ph', text: 'calibrate_ph_probe', children: [] },
          { id: 'v3-lab-chem-stock', text: 'reorder_nitrile_stock', children: [] },
        ],
      },
      {
        id: 'v3-lab-fab',
        text: 'fab/',
        children: [
          { id: 'v3-lab-fab-cnc', text: 'cnc_toolpath_night_run', children: [] },
        ],
      },
    ],
  },
  {
    id: 'v3-field',
    text: 'field/',
    priority: 'P2',
    children: [
      {
        id: 'v3-field-pack',
        text: 'pack/',
        children: [
          { id: 'v3-field-pack-kit', text: 'rebuild_day_kit', children: [] },
          { id: 'v3-field-pack-map', text: 'print_topo_overlays', children: [] },
        ],
      },
      {
        id: 'v3-field-route',
        text: 'route/',
        children: [
          { id: 'v3-field-route-a', text: 'scout_ridge_a', children: [] },
        ],
      },
    ],
  },
];

/** Monotonic counter so seeded siblings keep their authored order. */
let seedClock = 0;

function seedTasks(nodes: SeedTask[], parentId: string | null): void {
  for (const node of nodes) {
    writeTask({
      id: node.id,
      text: node.text,
      parentId,
      priority: node.priority,
      completed: node.completed ?? false,
      createdAt: seedClock++,
    });
    seedTasks(node.children, node.id);
  }
}

function clearStore(): void {
  for (const key of [...yTasks.keys()]) yTasks.delete(key);
  if (yNotes.length > 0) yNotes.delete(0, yNotes.length);
  if (ySysLogs.length > 0) ySysLogs.delete(0, ySysLogs.length);
  for (const key of [...yMarkedDays.keys()]) yMarkedDays.delete(key);
}

function seedIfNeeded(): void {
  const current = yMeta.get('seedVersion');
  if (current === SEED_VERSION) return;

  doc.transact(() => {
    clearStore();
    yMeta.set('seedVersion', SEED_VERSION);
    yMeta.set('seeded', true);
    seedTasks(SEED_TASKS, null);
  });
}

/**
 * Two clients (two tabs, or a stale HMR worker) can both pass the "not seeded
 * yet" check before either write lands, and Yjs will faithfully merge both
 * inserts. Collapse any duplicate ids, keeping the earliest entry.
 */
function dedupeById(array: Y.Array<Y.Map<unknown>>): void {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  array.toArray().forEach((entry, index) => {
    const id = entry.get('id');
    if (typeof id !== 'string') return;
    if (seen.has(id)) duplicates.push(index);
    else seen.add(id);
  });

  if (duplicates.length === 0) return;

  doc.transact(() => {
    for (let i = duplicates.length - 1; i >= 0; i--) {
      array.delete(duplicates[i], 1);
    }
  });
}

// ---------------------------------------------------------------------------
// WRITES
// ---------------------------------------------------------------------------

function writeTask(task: {
  id: string;
  text: string;
  parentId: string | null;
  priority?: TaskPriority;
  completed?: boolean;
  createdAt: number;
}): void {
  const entry = new Y.Map<unknown>();
  entry.set('id', task.id);
  entry.set('text', task.text);
  entry.set('parentId', task.parentId);
  entry.set('completed', task.completed ?? false);
  entry.set('createdAt', task.createdAt);
  if (task.priority) entry.set('priority', task.priority);
  yTasks.set(task.id, entry);
}

function noteToYMap(note: NoteEntry): Y.Map<unknown> {
  const entry = new Y.Map<unknown>();
  entry.set('id', note.id);
  entry.set('date', note.date);
  entry.set('text', note.text);
  if (note.attachment) entry.set('attachment', note.attachment);
  return entry;
}

function sysLogToYMap(log: SysLog): Y.Map<unknown> {
  const entry = new Y.Map<unknown>();
  entry.set('id', log.id);
  entry.set('date', log.date);
  entry.set('text', log.text);
  return entry;
}

// ---------------------------------------------------------------------------
// READS
// ---------------------------------------------------------------------------

interface FlatTask {
  id: string;
  text: string;
  priority?: TaskPriority;
  completed: boolean;
  parentId: string | null;
  createdAt: number;
}

function readFlatTasks(): FlatTask[] {
  const rows: FlatTask[] = [];

  yTasks.forEach((entry) => {
    const id = entry.get('id');
    if (typeof id !== 'string') return;

    rows.push({
      id,
      text: (entry.get('text') as string) ?? '',
      priority: entry.get('priority') as TaskPriority | undefined,
      completed: (entry.get('completed') as boolean) ?? false,
      parentId: (entry.get('parentId') as string | null) ?? null,
      createdAt: (entry.get('createdAt') as number) ?? 0,
    });
  });

  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

function buildTaskTree(): TaskNode[] {
  const byParent = new Map<string | null, FlatTask[]>();

  for (const row of readFlatTasks()) {
    const siblings = byParent.get(row.parentId);
    if (siblings) siblings.push(row);
    else byParent.set(row.parentId, [row]);
  }

  const visited = new Set<string>();

  const build = (parentId: string | null): TaskNode[] =>
    (byParent.get(parentId) ?? [])
      .filter((row) => !visited.has(row.id))
      .map((row) => {
        visited.add(row.id);
        return {
          id: row.id,
          text: row.text,
          priority: row.priority,
          completed: row.completed,
          children: build(row.id),
        };
      });

  return build(null);
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function readNotes(): NoteEntry[] {
  return uniqueById(
    yNotes.toArray().map((entry) => ({
      id: entry.get('id') as string,
      date: entry.get('date') as string,
      text: entry.get('text') as string,
      attachment: entry.get('attachment') as string | undefined,
    })),
  );
}

function readSysLogs(): SysLog[] {
  return uniqueById(
    ySysLogs.toArray().map((entry) => ({
      id: entry.get('id') as string,
      date: entry.get('date') as string,
      text: entry.get('text') as string,
    })),
  );
}

function buildSnapshot(): VaultSnapshot {
  return {
    tasks: buildTaskTree(),
    notes: readNotes(),
    sysLogs: readSysLogs(),
    markedDays: [...yMarkedDays.keys()]
      .map(Number)
      .filter((day) => Number.isFinite(day))
      .sort((a, b) => a - b),
  };
}

function postSnapshot(): void {
  ctx.postMessage({ type: 'SNAPSHOT', payload: buildSnapshot() });
}

// ---------------------------------------------------------------------------
// LIFECYCLE
// ---------------------------------------------------------------------------

let persistence: IndexeddbPersistence | null = null;

function init(): void {
  if (persistence) {
    postSnapshot();
    return;
  }

  persistence = new IndexeddbPersistence(DOC_NAME, doc);
  doc.on('update', postSnapshot);

  persistence.whenSynced.then(() => {
    dedupeById(yNotes);
    dedupeById(ySysLogs);
    seedIfNeeded();
    postSnapshot();
  });
}

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  switch (request.type) {
    case 'INIT': {
      init();
      break;
    }

    case 'ADD_TASK': {
      writeTask({ ...request.payload, createdAt: Date.now() });
      break;
    }

    case 'TOGGLE_TASK': {
      const entry = yTasks.get(request.payload.id);
      if (entry) entry.set('completed', !(entry.get('completed') as boolean));
      break;
    }

    case 'ADD_NOTE': {
      yNotes.unshift([noteToYMap(request.payload)]);
      break;
    }

    case 'ADD_SYS_LOG': {
      const { day, ...log } = request.payload;
      doc.transact(() => {
        ySysLogs.push([sysLogToYMap(log)]);
        yMarkedDays.set(String(day), true);
      });
      break;
    }

    case 'DELETE_SYS_LOG': {
      const index = ySysLogs
        .toArray()
        .findIndex((entry) => entry.get('id') === request.payload.id);
      if (index !== -1) ySysLogs.delete(index, 1);
      break;
    }
  }
});
