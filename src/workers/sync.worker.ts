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

// `lib.webworker` isn't in tsconfig (DOM is), so narrow the global to the
// message-passing surface we actually use.
const ctx = self as unknown as {
  postMessage(message: WorkerResponse): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<WorkerRequest>) => void,
  ): void;
};

const DOC_NAME = 'tui-os-vault';

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
const yMeta = doc.getMap<boolean>('meta');

// ---------------------------------------------------------------------------
// SEED
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
    id: '1',
    text: 'SYSTEM_OUTAGE_RESOLUTION',
    priority: 'URGENT',
    children: [{ id: '1-1', text: 'bypass_crdt_firewall', children: [] }],
  },
  {
    id: '2',
    text: 'PREP_FERAL_PIG_ULTRA_GEAR',
    priority: 'P1',
    children: [
      {
        id: '2-1',
        text: 'calculate_carb_and_hydration_ratios',
        children: [
          {
            id: '2-1-1',
            text: 'Buy gel',
            children: [{ id: '2-1-1-1', text: 'Wntwe rhe deagon', children: [] }],
          },
        ],
      },
      {
        id: '2-2',
        text: 'map_aid_station_drops',
        children: [
          {
            id: '2-2-1',
            text: 'Appease the gods',
            children: [{ id: '2-2-1-1', text: 'Have a look', children: [] }],
          },
        ],
      },
    ],
  },
  {
    id: '3',
    text: 'COMMODORE_RIM_FABRICATION',
    priority: 'P2',
    completed: true,
    children: [
      { id: '3-1', text: 'structurally_mount_makita_backing_pad', children: [] },
    ],
  },
];

const SEED_NOTES: NoteEntry[] = [
  {
    id: 'n1',
    date: '08.10.26',
    text: 'Wildcat Resources (WC8) drill results dropping.',
  },
  {
    id: 'n2',
    date: '08.09.26',
    text: 'Lucky bamboo cuttings rooted successfully.',
    attachment: 'http://vlt.link/img_773.jpg',
  },
  {
    id: 'n3',
    date: '08.02.26',
    text: 'NZ Itinerary draft for Chase. August dates confirmed.',
  },
];

const SEED_SYS_LOGS: SysLog[] = [
  { id: 'l1', date: '08.11.26', text: 'BUY MILK' },
  { id: 'l2', date: '08.11.26', text: 'WALK THE OLD DOG' },
];

const SEED_MARKED_DAYS = [2, 9, 14, 28];

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

function hasEntry(array: Y.Array<Y.Map<unknown>>, id: string): boolean {
  return array.toArray().some((entry) => entry.get('id') === id);
}

function seedIfEmpty(): void {
  if (yMeta.get('seeded')) return;

  doc.transact(() => {
    yMeta.set('seeded', true);
    // Keyed writes (Y.Map) are idempotent by construction; the arrays need an
    // explicit existence check so a re-seed can't append a second copy.
    seedTasks(SEED_TASKS, null);

    for (const note of SEED_NOTES) {
      if (!hasEntry(yNotes, note.id)) yNotes.push([noteToYMap(note)]);
    }
    for (const log of SEED_SYS_LOGS) {
      if (!hasEntry(ySysLogs, log.id)) ySysLogs.push([sysLogToYMap(log)]);
    }
    for (const day of SEED_MARKED_DAYS) yMarkedDays.set(String(day), true);
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

  // Delete back-to-front so the remaining indexes stay valid.
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
  // Y.Map cannot hold `undefined`, so only write a priority when there is one.
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

  // `visited` guards against a cycle in `parentId` (a corrupt or concurrently
  // re-parented doc) turning the walk into infinite recursion.
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

/** Belt-and-braces: never hand React a list with repeated keys. */
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
    // A second mount (React StrictMode, hot reload) just needs the current state.
    postSnapshot();
    return;
  }

  persistence = new IndexeddbPersistence(DOC_NAME, doc);

  // Every update -- local edit or one replayed from IndexedDB -- republishes
  // the materialized view.
  doc.on('update', postSnapshot);

  persistence.whenSynced.then(() => {
    // Heal any duplicates a previous concurrent seed left at rest, then seed.
    dedupeById(yNotes);
    dedupeById(ySysLogs);
    seedIfEmpty();
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
      // Newest first, matching the scratchpad's prepend order.
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
