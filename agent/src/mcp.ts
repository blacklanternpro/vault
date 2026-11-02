import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { boardCards } from '../../src/model/doc.js'
import { LANES } from '../../src/model/types.js'
import { AGENT_VERSION } from './config.js'
import type { FileStore } from './store.js'
import { createHandlers, type Handlers, type ToolResult } from './tools.js'

/*
 * The MCP face of the agent: every handler in tools.ts as a tool, plus two
 * resources (the task list and one task's brief). Each tool answers with a
 * short text block, a JSON text block, and the same JSON as structuredContent.
 */

const ref = z.union([z.number().int().positive(), z.string().min(1)]).describe('A task: its id (5 or "#5") or its title (forgiving: case, a typo or two, or the first words)')

function ok<T>(r: ToolResult<T>): CallToolResult {
  const data = r.data as Record<string, unknown>
  return { content: [{ type: 'text', text: r.text }, { type: 'text', text: JSON.stringify(data) }], structuredContent: data }
}

function fail(err: unknown): CallToolResult {
  const message = err instanceof Error ? err.message : String(err)
  return { isError: true, content: [{ type: 'text', text: message }] }
}

/** A handler's answer as a tool result; an AgentError (or anything else thrown) becomes an isError result with its message. */
function run<T>(fn: () => ToolResult<T>): CallToolResult {
  try {
    return ok(fn())
  } catch (err) {
    return fail(err)
  }
}

export function createMcpServer(store: FileStore, handlers: Handlers = createHandlers(store)): McpServer {
  const server = new McpServer(
    { name: 'vault', version: AGENT_VERSION },
    {
      instructions: [
        'VAULT is the person\'s task board. Start with vault_list_tasks, then vault_get_task for the brief of the task you were handed.',
        'Work from the brief. As you finish subtasks call vault_tick, and when you stop call vault_report once with a markdown report:',
        '"## Report" then "- [x] subtask you finished", "- [ ] new subtask you found" and "Left off: where you stopped".',
        'Titles are matched forgivingly (case, a typo or two, or the first words); ids always work.',
      ].join(' '),
    },
  )

  server.registerTool(
    'vault_list_tasks',
    {
      title: 'List tasks',
      description: 'The cards on the VAULT board, optionally narrowed to one project, one status, or tonight\'s shelf. Returns a compact table and the same rows as JSON (id, title, project, status, due, next action, subtask progress).',
      inputSchema: {
        project: z.union([z.number().int().positive(), z.string().min(1)]).optional().describe('Project name or id; leave out for every project'),
        status: z.enum(LANES).optional().describe('Only tasks in this lane: pending, rnd, active, done or dusted'),
        tonight: z.boolean().optional().describe("Only tasks on tonight's shelf"),
      },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => handlers.listTasks(args)),
  )

  server.registerTool(
    'vault_get_task',
    {
      title: 'Get task brief',
      description: 'One task as a markdown brief: title, project, status, due, goal, next action, subtasks (- [x]/- [ ]), links, where the person left off, the recent trail, what "done" means, and how to report back. Give an id or a title.',
      inputSchema: {
        id: ref.optional(),
        title: z.string().min(1).optional().describe('The task title, when you have no id'),
      },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => handlers.getTask(args)),
  )

  server.registerTool(
    'vault_tick',
    {
      title: 'Tick a subtask',
      description: 'Mark one open subtask of a task as done. The subtask is matched by title (case-insensitive, a typo or two, or a prefix) or by its id.',
      inputSchema: { id: ref, subtask: z.string().min(1).describe('The subtask title as shown in the brief, or its id') },
      annotations: { idempotentHint: true },
    },
    (args) => run(() => handlers.tick(args)),
  )

  server.registerTool(
    'vault_add_subtask',
    {
      title: 'Add a subtask',
      description: 'Add a subtask line to a task, open by default or already done when `done` is true. Refuses an exact duplicate.',
      inputSchema: { id: ref, title: z.string().min(1).describe('The new subtask'), done: z.boolean().optional().describe('Add it already ticked') },
    },
    (args) => run(() => handlers.addSubtask(args)),
  )

  server.registerTool(
    'vault_set_status',
    {
      title: 'Set status',
      description: 'Move a task to a lane: pending, rnd (R&D), active, done or dusted (dropped).',
      inputSchema: { id: ref, status: z.enum(LANES).describe('The lane to move it to') },
      annotations: { idempotentHint: true },
    },
    (args) => run(() => handlers.setStatus(args)),
  )

  server.registerTool(
    'vault_set_next',
    {
      title: 'Set next action',
      description: 'Set the one next action shown on the task\'s card. An empty string clears it.',
      inputSchema: { id: ref, next: z.string().describe('The next action, one line') },
      annotations: { idempotentHint: true },
    },
    (args) => run(() => handlers.setNext(args)),
  )

  server.registerTool(
    'vault_left_off',
    {
      title: 'Note where you left off',
      description: 'Record where work on a task stopped, so the next session (person or agent) can pick it up. An empty string clears it.',
      inputSchema: { id: ref, text: z.string().describe('Where you got to, one or two lines') },
      annotations: { idempotentHint: true },
    },
    (args) => run(() => handlers.leftOff(args)),
  )

  server.registerTool(
    'vault_add_link',
    {
      title: 'Add a link',
      description: 'Attach an http(s) link to a task: a repo, a PR, a deploy, a design file, a thread. The label defaults to the host.',
      inputSchema: { id: ref, url: z.string().min(1).describe('The URL'), label: z.string().optional().describe('A short label') },
      annotations: { idempotentHint: true },
    },
    (args) => run(() => handlers.addLink(args)),
  )

  server.registerTool(
    'vault_report',
    {
      title: 'Report back',
      description:
        'Send your end-of-run report for a task and apply it in one write. Markdown: a "## Report" heading, then "- [x] title" for each subtask you finished (ticked; a new one is added as done), "- [ ] title" for new subtasks you found (added), and "Left off: ..." for where you stopped. Returns what was ticked, added and skipped, and files the report in the VAULT inbox for the person.',
      inputSchema: { id: ref, report: z.string().min(1).describe('The markdown report') },
    },
    (args) => run(() => handlers.report(args)),
  )

  server.registerTool(
    'vault_create_task',
    {
      title: 'Create a task',
      description: 'Create a task card in a project. Status defaults to pending; due is YYYY-MM-DD.',
      inputSchema: {
        project: z.union([z.number().int().positive(), z.string().min(1)]).describe('Project name or id (must exist)'),
        title: z.string().min(1).describe('The task title'),
        status: z.enum(LANES).optional().describe('pending (default), rnd, active, done or dusted'),
        next: z.string().optional().describe('The first next action'),
        due: z.string().optional().describe('Due date, YYYY-MM-DD'),
      },
    },
    (args) => run(() => handlers.createTask(args)),
  )

  server.registerTool(
    'vault_search',
    {
      title: 'Search',
      description: 'Find projects, tasks and subtasks whose title or goal contains the text. Each hit names the card it belongs to.',
      inputSchema: { q: z.string().min(1).describe('Text to look for') },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => handlers.search(args)),
  )

  server.registerResource(
    'tasks',
    'vault://tasks',
    { title: 'VAULT tasks', description: 'Every card on the board, as a table', mimeType: 'text/markdown' },
    (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: handlers.tasksMarkdown() }] }),
  )

  server.registerResource(
    'task',
    new ResourceTemplate('vault://task/{id}', {
      list: () => ({
        resources: boardCards(store.read().doc, null).map((n) => ({ uri: `vault://task/${n.id}`, name: n.title, description: `Brief for task #${n.id}`, mimeType: 'text/markdown' })),
      }),
    }),
    { title: 'VAULT task brief', description: 'One task as a markdown brief', mimeType: 'text/markdown' },
    (uri, vars) => {
      const id = Array.isArray(vars.id) ? vars.id[0] : vars.id
      const brief = handlers.getTask({ id: String(id) })
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: brief.text }] }
    },
  )

  return server
}

/** Serves MCP over stdio until the client hangs up. Logs go to stderr; stdout is the protocol. */
export async function runMcp(store: FileStore): Promise<void> {
  const server = createMcpServer(store)
  const transport = new StdioServerTransport()
  const closed = new Promise<void>((resolve) => {
    server.server.onclose = () => resolve()
  })
  await server.connect(transport)
  process.stderr.write(`vault-agent mcp: serving ${store.file}\n`)
  await closed
}
