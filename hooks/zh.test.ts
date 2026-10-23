import { test, expect } from 'claude-code/testing'

import { SCENES } from './scenes'
import { cleanScript, said, stage } from './script'
import { CAPTION_KEYS, captionFor, captionLine } from './zh'

const SCENE = { background: { effect: 'starfield', palette: ['#fff', '#88f'], speed: 1, intensity: 0 }, actors: [], particles: [] }

test('a line is translated whole, or by its template with the file and the number filled in', () => {
  expect(captionFor('Green light, you pass. Next!')).toBe('綠燈,通過。下一位!')
  expect(captionFor('Rush hour on auth.ts. Keep it moving!')).toBe('auth.ts 的尖峰時段,別停,繼續走!')
  expect(captionFor('Bronto-crane, block 4 of npm test!')).toBe('雷龍吊車,npm test 的第 4 塊!')
  expect(captionFor('IT LIVES! mostly. 2 tests twitching in npm test.')).toContain('2 個測試')
  expect(captionFor('A line nobody wrote')).toBe('')
})

test('every translation key is unique and every caption is Chinese', () => {
  expect(new Set(CAPTION_KEYS).size).toBe(CAPTION_KEYS.length)
  for (const key of CAPTION_KEYS) {
    const filled = key.replace(/\{n\}/g, '3').replace(/\{what\}/g, 'src/app.ts')
    expect(captionFor(filled)).toMatch(/[一-鿿]/)
  }
})

test('a caption fits the columns, counting a Chinese character as two', () => {
  expect(captionLine(['Green light, you pass. Next!'], 40)).toBe('綠燈,通過。下一位!')
  const cut = captionLine(['The mound grows. Nobody knows why it takes so long.'], 20)
  expect(cut.endsWith('…')).toBe(true)
  expect(captionLine(['no such line'], 40)).toBe('')
})

test('a stage records the lines its bubbles say', () => {
  const script = cleanScript({ ...SCENE, actors: [{ kind: 'sprite', frames: ['   \n   '], fps: 0, x: '20', y: '3', color: '#fff', say: 'Green light, you pass. Next!', sayAt: 0 }] })
  if (!script) throw new Error('bad script')
  stage({ cols: 80, rows: 9, t: 0, script, since: 20_000, reveal: 1 })
  expect(said.lines).toEqual(['Green light, you pass. Next!'])
})

test('every line the stock says in a bubble has a caption', { timeoutMs: 60_000 }, () => {
  const missing = new Set<string>()
  for (const stock of SCENES) {
    const script = cleanScript(JSON.parse(JSON.stringify(stock.scene).split('{what}').join('src/app.ts')))
    if (!script) continue
    // Play the scene across its life and collect what its bubbles say.
    for (const since of [3000, 8000, 14_000, 20_000, 30_000, 45_000]) {
      stage({ cols: 100, rows: 9, t: since / 1000, script, since, reveal: 1 })
      for (const line of said.lines) if (!captionFor(line)) missing.add(line)
    }
  }
  expect([...missing]).toEqual([])
})
