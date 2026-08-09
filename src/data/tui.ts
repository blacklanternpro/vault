// Static seed data for the VAULT layout scaffold. Swap for a real feed /
// API layer later -- every UI piece below is already data-driven.

export const VAULT_ROWS = [
  { key: 'SYS.ID', value: 'TUI_KERNEL_V1' },
  { key: 'STATUS', value: 'OFFLINE_READY // SYNC_OK' },
  { key: 'LOC.NODE', value: 'EAST BUNBURY, WA' },
  { key: 'TIMESTAMP', value: '2026-08-09 // 21:08:21 AWST' },
] as const;

export const INDEX_ITEMS = [
  { id: '01', label: 'CALENDAR' },
  { id: '02', label: 'EXTENDED_TASKS' },
  { id: '03', label: 'NOTES' },
] as const;

export const CALENDAR_ENTRIES = [
  {
    date: '08.10',
    time: '09:00',
    node: 'SOUND_ROOM',
    event: 'SYSTEM_SYNC :: ALL_NIGHT',
  },
  {
    date: '08.11',
    time: '14:30',
    node: 'MAIN_HALL',
    event: 'KERNEL_PATCH_REVIEW',
  },
  {
    date: '08.12',
    time: '11:00',
    node: 'REMOTE',
    event: 'STANDUP // TEAM_ALPHA',
  },
  {
    date: '08.14',
    time: '19:00',
    node: 'E_BUNBURY',
    event: 'GRID_ENGINE :: DEMO',
  },
] as const;

export type TaskStatus = 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'QUEUED';

export const TASK_ITEMS: Array<{
  id: string;
  mark: 'X' | '~' | ' ';
  label: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  status: TaskStatus;
}> = [
  {
    id: '01',
    mark: 'X',
    label: 'REBUILD_AUTH_MODULE',
    priority: 'HIGH',
    status: 'DONE',
  },
  {
    id: '02',
    mark: ' ',
    label: 'MIGRATE_DB_SCHEMA',
    priority: 'MED',
    status: 'PENDING',
  },
  {
    id: '03',
    mark: '~',
    label: 'REFACTOR_GRID_ENGINE',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
  },
  {
    id: '04',
    mark: ' ',
    label: 'WRITE_TUI_DOCS',
    priority: 'LOW',
    status: 'QUEUED',
  },
];

export const NOTES_LOG = [
  { time: '21:04:11', message: 'grid engine passed diagnostics' },
  { time: '20:47:02', message: 'sync completed with node east_bunbury' },
  { time: '19:12:55', message: 'pending review on kernel patch #114' },
  {
    time: '18:02:40',
    message: 'drafted layout spec for architectural_grid',
  },
] as const;
