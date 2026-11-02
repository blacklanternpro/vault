import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMcpServer } from '../src/mcp'
import { createHandlers } from '../src/tools'
import { makeStore, T0, type Fixture } from './fixture'

/*
 * The handlers are covered in tools.test.ts; this checks the MCP wiring
 * around them, over an in-memory transport: tool and resource listings,
 * argument validation, the text + JSON + structuredContent shape of a
 * result, and errors arriving as isError results rather than crashes.
 */

let fx: Fixture
let client: Client
let server: ReturnType<typeof createMcpServer>

beforeEach(async () => {
  fx = makeStore()
  server = createMcpServer(fx.store, createHandlers(fx.store, () => T0 + 1))
  const [a, b] = InMemoryTransport.createLinkedPair()
  client = new Client({ name: 'test', version: '0' })
  await Promise.all([server.connect(a), client.connect(b)])
})
afterEach(async () => {
  await client.close()
  await server.close()
  fx.cleanup()
})

const text = (r: CallToolResult, i = 0) => (r.content[i] as { text: string }).text

describe('tools', () => {
  it('registers every tool with a description and a schema', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['vault_add_link', 'vault_add_subtask', 'vault_create_task', 'vault_get_task', 'vault_left_off', 'vault_list_tasks', 'vault_report', 'vault_search', 'vault_set_next', 'vault_set_status', 'vault_tick'].sort(),
    )
    for (const t of tools) {
      expect(t.description?.length).toBeGreaterThan(20)
      expect(t.inputSchema.type).toBe('object')
    }
    const tick = tools.find((t) => t.name === 'vault_tick')!
    expect(tick.inputSchema.required).toEqual(['id', 'subtask'])
  })

  it('answers with text, JSON and structuredContent', async () => {
    const r = (await client.callTool({ name: 'vault_list_tasks', arguments: { project: 'homepage' } })) as CallToolResult
    expect(r.isError).toBeFalsy()
    expect(text(r)).toMatch(/^2 tasks \(project homepage\)\n/)
    expect(JSON.parse(text(r, 1))).toMatchObject({ count: 2 })
    expect(r.structuredContent).toMatchObject({ count: 2, tasks: [{ id: 2 }, { id: 8 }] })
  })

  it('runs a tick and a report through the transport', async () => {
    const tick = (await client.callTool({ name: 'vault_tick', arguments: { id: '#2', subtask: 'create wireframes' } })) as CallToolResult
    expect(text(tick)).toContain('Ticked "Create wireframes"')
    const report = (await client.callTool({ name: 'vault_report', arguments: { id: 2, report: '## Report\n- [x] design high-fidelity mockups\nLeft off: done for tonight' } })) as CallToolResult
    expect(report.structuredContent).toMatchObject({ ticked: [{ id: 6 }], leftOff: 'done for tonight', inboxIndex: 0 })
    expect(fx.store.readInbox()).toHaveLength(1)
  })

  it('turns a handler error into an isError result with the message', async () => {
    const r = (await client.callTool({ name: 'vault_get_task', arguments: { id: 'navv' } })) as CallToolResult
    expect(r.isError).toBe(true)
    expect(text(r)).toBe("No task matches 'navv'; closest: NAV RESTRUCTURE (#8)")
  })

  it('rejects arguments that do not fit the schema before the handler runs', async () => {
    const before = fx.store.read().savedAt
    const r = (await client.callTool({ name: 'vault_set_status', arguments: { id: 2, status: 'sideways' } })) as CallToolResult
    expect(r.isError).toBe(true)
    expect(text(r)).toMatch(/Input validation error.*vault_set_status.*"pending"\|"rnd"\|"active"\|"done"\|"dusted"/)
    expect(fx.store.read().savedAt).toBe(before)
  })
})

describe('resources', () => {
  it('lists vault://tasks, the task template and one resource per card', async () => {
    const { resources } = await client.listResources()
    expect(resources.map((r) => r.uri)).toContain('vault://tasks')
    expect(resources.filter((r) => r.uri.startsWith('vault://task/'))).toHaveLength(11)
    const { resourceTemplates } = await client.listResourceTemplates()
    expect(resourceTemplates.map((t) => t.uriTemplate)).toEqual(['vault://task/{id}'])
  })

  it('reads the list and a brief', async () => {
    const list = await client.readResource({ uri: 'vault://tasks' })
    expect(list.contents[0]).toMatchObject({ uri: 'vault://tasks', mimeType: 'text/markdown' })
    expect((list.contents[0] as { text: string }).text).toContain('SITE REDESIGN')
    const brief = await client.readResource({ uri: 'vault://task/2' })
    expect((brief.contents[0] as { text: string }).text.startsWith('# SITE REDESIGN\n')).toBe(true)
    await expect(client.readResource({ uri: 'vault://task/999' })).rejects.toThrow(/No task #999/)
  })
})
