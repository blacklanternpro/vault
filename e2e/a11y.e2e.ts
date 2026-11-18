import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Accessibility (audit 10, audit 12). axe-core over the main screens, and a
 * reduced-motion check. The app has known issues today; they are listed, one
 * by one with the audit finding they belong to, in e2e/a11y-baseline.json.
 * Anything serious or critical that is NOT in the baseline fails, so CI is
 * green today and any new violation turns it red. When a baselined issue is
 * fixed, delete its entry (a refresh with A11Y_RECORD shows what is left).
 *
 * To see what the check finds now (for a baseline refresh):
 *   A11Y_RECORD=1 npx playwright test e2e/a11y.e2e.ts
 * writes test-results/a11y-found.json. Copy entries across by hand, each with
 * its audit ref and a note: the baseline is a list of debts, not an ignore file.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASELINE_FILE = path.join(HERE, 'a11y-baseline.json')
const RECORD = !!process.env.A11Y_RECORD

type AxeEntry = { rule: string; selector: string; audit: string; note?: string; screens?: string[] }
type MotionEntry = { selector: string; property: 'animation' | 'transition'; audit: string; note?: string }
type Baseline = { axe: AxeEntry[]; motion: MotionEntry[] }

const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) as Baseline
const found: { axe: Array<Omit<AxeEntry, 'audit'> & { impact: string; help: string; screen: string }>; motion: Array<Omit<MotionEntry, 'audit'> & { value: string; screen: string }> } = {
  axe: [],
  motion: [],
}

test.afterAll(() => {
  if (!RECORD) return
  const out = path.join(HERE, '..', 'test-results', 'a11y-found.json')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  let prior: typeof found = { axe: [], motion: [] }
  try {
    prior = JSON.parse(fs.readFileSync(out, 'utf8')) as typeof found
  } catch {
    /* first */
  }
  fs.writeFileSync(out, JSON.stringify({ axe: [...prior.axe, ...found.axe], motion: [...prior.motion, ...found.motion] }, null, 2) + '\n')
})

/** A baseline selector matches exactly, or as a regex when written /like this/. */
function matches(pattern: string, value: string): boolean {
  if (pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/')) return new RegExp(pattern.slice(1, -1)).test(value)
  return pattern === value
}

type Screen = { name: string; open: (page: Page) => Promise<void> }

const SCREENS: Screen[] = [
  { name: 'board at rest', open: async () => {} },
  {
    name: 'drawer open',
    open: async (page) => {
      await page.getByTestId('card-2').click()
      await expect(page.getByTestId('drawer')).toBeVisible()
    },
  },
  {
    name: 'directory focused',
    open: async (page) => {
      await page.getByTestId('tree').focus()
      await page.keyboard.press('ArrowDown')
      await expect(page.locator('[role=treeitem][aria-selected=true]')).toHaveCount(1)
    },
  },
  {
    name: 'menu open',
    open: async (page) => {
      await page.getByTestId('menu').click()
      await expect(page.getByRole('menu')).toBeVisible()
    },
  },
  {
    name: 'palette open',
    open: async (page) => {
      await page.getByTestId('board').click({ position: { x: 5, y: 5 } })
      await page.keyboard.press('Control+k')
      await expect(page.getByTestId('palette')).toBeVisible()
      await page.keyboard.type('design')
      await expect(page.getByTestId('palette-row-0')).toBeVisible()
    },
  },
]

async function ready(page: Page) {
  await page.goto('/')
  await expect(page.getByTestId('board')).toBeVisible()
  // Let entry animations settle so colour checks read the resting state.
  await page.waitForTimeout(400)
}

test.describe('axe: no new serious or critical violations', () => {
  for (const screen of SCREENS) {
    test(screen.name, async ({ page }, info) => {
      await ready(page)
      await screen.open(page)
      await page.waitForTimeout(300)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      const fresh: string[] = []
      let known = 0
      for (const v of results.violations) {
        if (v.impact !== 'serious' && v.impact !== 'critical') continue
        for (const node of v.nodes) {
          const selector = node.target.map(String).join(' >> ')
          found.axe.push({ rule: v.id, selector, impact: v.impact, help: v.help, screen: screen.name })
          const hit = baseline.axe.some((b) => b.rule === v.id && matches(b.selector, selector) && (!b.screens || b.screens.includes(screen.name)))
          if (hit) known++
          else fresh.push(`${v.id} (${v.impact}) ${selector}\n    ${v.help}\n    ${node.failureSummary?.split('\n').join('\n    ') ?? ''}`)
        }
      }
      info.annotations.push({ type: 'a11y', description: `${screen.name}: ${known} baselined serious/critical node(s), ${fresh.length} new` })
      if (RECORD) return
      expect(fresh, `New accessibility violations on "${screen.name}". Fix them, or (only if it is a known debt) add them to e2e/a11y-baseline.json with an audit ref:\n  ${fresh.join('\n  ')}`).toEqual([])
    })
  }
})

/**
 * Everything that would move: elements with a running/declared animation or
 * a transition with a non-zero duration. Returned as a short selector
 * (tag#id.class.class) so the baseline can name it.
 */
async function moving(page: Page): Promise<Array<{ selector: string; property: 'animation' | 'transition'; value: string }>> {
  return page.evaluate(() => {
    const nonzero = (list: string) => list.split(',').some((d) => parseFloat(d) > 0)
    const name = (el: Element) => {
      const tid = el.getAttribute('data-testid')
      const cls = [...el.classList].filter((c) => !/^is-|^has-/.test(c)).slice(0, 3)
      return `${el.tagName.toLowerCase()}${tid ? `[data-testid=${tid.replace(/-\d+$/, '-N')}]` : ''}${cls.map((c) => `.${c}`).join('')}`
    }
    const seen = new Map<string, { selector: string; property: 'animation' | 'transition'; value: string }>()
    const all = [document.documentElement, ...document.querySelectorAll('body *')]
    for (const el of all) {
      for (const pseudo of [null, '::before', '::after'] as const) {
        const cs = getComputedStyle(el, pseudo)
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue
        const sel = name(el) + (pseudo ?? '')
        if (cs.animationName !== 'none' && nonzero(cs.animationDuration)) {
          const k = `${sel}|animation`
          if (!seen.has(k)) seen.set(k, { selector: sel, property: 'animation', value: `${cs.animationName} ${cs.animationDuration}` })
        }
        if (cs.transitionProperty !== 'none' && nonzero(cs.transitionDuration)) {
          const k = `${sel}|transition`
          if (!seen.has(k)) seen.set(k, { selector: sel, property: 'transition', value: `${cs.transitionProperty} ${cs.transitionDuration}` })
        }
      }
    }
    // Web Animations started from script (they skip the stylesheet's reduced-motion rule).
    for (const a of document.getAnimations()) {
      const t = a.effect?.getComputedTiming()
      const target = (a.effect as KeyframeEffect | null)?.target
      if (!t || !target || !(Number(t.duration) > 0) || a.playState === 'finished') continue
      const sel = name(target) + ((a.effect as KeyframeEffect).pseudoElement ?? '')
      const k = `${sel}|animation`
      if (!seen.has(k)) seen.set(k, { selector: sel, property: 'animation', value: `web animation ${t.duration}ms` })
    }
    return [...seen.values()]
  })
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  const motionScreens: Screen[] = [
    ...SCREENS.filter((s) => s.name === 'board at rest' || s.name === 'drawer open' || s.name === 'menu open'),
    {
      // Sampled straight after the key, while the card's FLIP slide would be running.
      name: 'card moving to the next lane',
      open: async (page) => {
        await page.getByTestId('card-8').focus()
        await page.keyboard.press('Shift+L')
      },
    },
  ]
  for (const screen of motionScreens) {
    test(`nothing animates with prefers-reduced-motion: ${screen.name}`, async ({ page }, info) => {
      await ready(page)
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
      await screen.open(page)
      const fresh: string[] = []
      let known = 0
      for (const m of await moving(page)) {
        found.motion.push({ ...m, screen: screen.name })
        if (baseline.motion.some((b) => b.property === m.property && matches(b.selector, m.selector))) known++
        else fresh.push(`${m.property}: ${m.selector} (${m.value})`)
      }
      info.annotations.push({ type: 'reduced-motion', description: `${screen.name}: ${known} baselined mover(s), ${fresh.length} new` })
      if (RECORD) return
      expect(fresh, `These move under prefers-reduced-motion: reduce. Give them a 0 duration in a reduced-motion rule (or baseline a known debt in e2e/a11y-baseline.json):\n  ${fresh.join('\n  ')}`).toEqual([])
    })
  }
})

test('the baseline names an audit finding for every entry', () => {
  for (const b of [...baseline.axe, ...baseline.motion]) expect(b.audit, JSON.stringify(b)).toMatch(/^audit \d+/)
})
