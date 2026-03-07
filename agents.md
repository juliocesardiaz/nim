# Agent Onboarding: Nim Game

Quick-reference for LLM agents joining this project.

---

## What This Is

A browser-based implementation of the classic mathematical strategy game **Nim**. Pure vanilla JS — no build tools, no dependencies, no server. Open `index.html` in any modern browser and it runs.

Live deployment via GitHub Pages on push to `main`.

---

## File Map

```
nim/
├── index.html                       # All markup, loads style.css + game.js
├── game.js                          # Entire application: state, AI, rendering, events
├── style.css                        # Dark theme, layout, stone animations
├── favicon.svg                      # SVG logo for browser tab
├── README.md                        # User-facing docs (rules, setup, AI explanation)
├── test_nimsum.js                   # Validates incremental XOR nim-sum matches full recalculation
├── test_perf.js                     # Performance benchmark for aiMoveEasy (100k iterations)
├── .jules/bolt.md                   # Bolt agent notes on the XOR optimisation
└── .github/workflows/static.yml     # GitHub Pages deploy on push to main
```

There is no `package.json`, no build step. Tests (`test_nimsum.js`, `test_perf.js`) run directly with Node.js — no test runner required.

---

## Architecture

Everything lives in `game.js` (334 lines). No modules, no classes — just functions operating on a single shared state object.

### State (`game.js:1`)

```js
const state = {
  piles: number[],              // stone counts per pile
  currentPlayer: 0 | 1,        // 0 = Player 1 / Human, 1 = Player 2 / AI
  selectedPile: number | null,  // which pile the human has clicked
  mode: 'hvh' | 'hva',         // Human vs Human or Human vs AI
  variant: 'normal' | 'misere',
  difficulty: 'easy' | 'medium' | 'hard',  // default: 'hard'
  over: boolean
}
```

State is reset on every call to `startGame()`. There is no persistence — refreshing the page returns to the setup screen with default values.

### AI (`game.js:12–104`)

| Function | Difficulty | Behaviour |
|---|---|---|
| `nimSum(piles)` | — | XOR of all pile sizes; 0 = losing position for current player |
| `aiMove(piles, variant)` | Hard | Optimal: finds a move that reduces nim-sum to 0; handles Misère endgame separately |
| `aiMoveEasy(piles, variant)` | Easy | Anti-optimal: enumerates moves leaving nim-sum ≠ 0 using incremental XOR (`currentNs ^ piles[i] ^ (piles[i] - take)`) — O(NM), no array allocation; picks randomly from anti-optimal candidates; falls back to `fallback()` if already in a P-position |
| `aiMoveMedium(piles, variant)` | Medium | 30% chance of optimal play, 70% random (random pile + random take count) |
| `fallback(piles)` | — | Takes 1 from the largest non-empty pile; used when the AI is already in a losing position |

### Win Detection (`game.js:106–120`)

- `isGameOver(piles)` — true when all piles are 0
- `winner(lastPlayer, variant)` — Normal: last mover wins; Misère: last mover loses

### Rendering (`game.js:122–191`)

- `playerName(idx)` — returns `"You"` / `"AI"` in HvA mode, `"Player 1"` / `"Player 2"` in HvH mode; used by `renderStatus()` and `showResult()`
- `renderPiles(removingPile?, removingCount?)` — fully rebuilds `#piles-container`; pass args to mark stones with `.removing` during the 300 ms animation. Dynamically applies these classes to each `.pile-row`:
  - `.empty` — pile has 0 stones
  - `.selected` — this pile is the currently selected pile
  - `.disabled` — game over, or it's the AI's turn (prevents clicks)
- `renderStatus()` — updates `#turn-label` text and `.ai-turn` class (pink for AI, teal for human); updates `#variant-label`
- `showResult(winnerIdx)` — populates `#result-text`, shows `#result-banner`, hides `#controls`

### Player Actions (`game.js:193–257`)

- `selectPile(idx)` — called on pile click; validates it's the human's turn
- `doTake(pileIdx, takeCount)` — executes a move; animates (300 ms), then updates state and switches player; triggers `triggerAI()` if it's the AI's turn
- `triggerAI()` — adds thinking indicator, waits 600 ms, then calls the appropriate AI function and calls `doTake()`

### Setup (`game.js:259–334`)

- `startGame()` — reads pile inputs (clamped 1–20) and dropdowns, resets full state, switches view from `#setup` to `#game`; called both on first start and on "Play Again"
- Event listeners wired at module level (no framework):
  - `#mode-select` change → toggles visibility of `#difficulty-setting`
  - `#take-count` input → calls `renderPiles(selectedPile, val)` to live-preview which stones will be removed as the user types
  - `#take-btn` click → clamps input value then calls `doTake()`
  - `#add-pile` / `#remove-pile` → append/remove `.pile-input` elements (1–6 limit enforced)
  - `#play-again` → calls `startGame()` (re-reads the same config)
  - `#back-btn` → shows `#setup`, hides `#game`

---

## Game Rules Summary

- Players alternate taking ≥ 1 stone from a single pile per turn.
- **Normal**: player who takes the last stone **wins**.
- **Misère**: player who takes the last stone **loses**.
- Config: 1–6 piles, 1–20 stones each. Default start: piles of 5, 5, 5 (configurable).

---

## DOM Structure

Two top-level views toggled with `.hidden`:

- `#setup` — configuration form (pile inputs, mode/variant/difficulty selects, start button)
- `#game` — active game (pile display, stone take controls, result banner)

Key element IDs used by `game.js`:

| ID | Purpose |
|---|---|
| `#setup` | Setup view (hidden during game) |
| `#game` | Game view (hidden during setup); receives `.ai-thinking` class during AI turn |
| `#piles-container` | Rebuilt on every `renderPiles()` call |
| `#turn-label` | Current player indicator; receives `.ai-turn` class when AI is playing |
| `#variant-label` | "Normal" or "Misère" |
| `#result-banner` | Win/lose overlay; hidden until game ends |
| `#result-text` | Text node inside `#result-banner` set by `showResult()` |
| `#controls` | Take-stones form; hidden on game over |
| `#take-count` | Stone count input; `max` attr updated on pile select; live-previews removal on `input` event |
| `#take-btn` | Submit move; disabled until a pile is selected |
| `#selected-pile-label` | Displays selected pile number or "—" |
| `#mode-select` | `'hvh'` / `'hva'` |
| `#variant-select` | `'normal'` / `'misere'` |
| `#difficulty-select` | `'easy'` / `'medium'` / `'hard'` |
| `#difficulty-setting` | Wrapper div hidden in HvH mode |
| `#pile-inputs` | Container for `.pile-input` number elements |
| `#add-pile` / `#remove-pile` | Add/remove pile inputs (1–6 limit) |
| `#start-game` | Launches game from setup |
| `#play-again` | Restarts with same config (calls `startGame()`) |
| `#back-btn` | Returns to setup screen |

---

## Styling Notes (`style.css`)

- **Background**: `#0A0A0A` (near-black)
- **Text**: `#F0EBE3` (bone)
- **Accent palette**: teal `#00F0B5`, blue `#0038FF`, red `#FF0A0A`, yellow `#FFD900`, pink `#FF0090`
- Yellow highlight = win state; pink = AI turn; teal = human/selected
- Stone removal animation: `300ms` CSS transition
- AI thinking state: `.ai-thinking` class on `#game`, blinking indicator `800ms`
- Responsive breakpoint at `768px`
- Fonts: IBM Plex Mono (UI labels), IBM Plex Sans (headings) via Google Fonts

---

## Security (`index.html`)

A strict Content Security Policy is set via a `<meta>` tag:

| Directive | Value | Effect |
|---|---|---|
| `default-src` | `'none'` | Block everything unless explicitly allowed |
| `script-src` | `'self'` | Only scripts from the same origin; **no inline scripts** |
| `style-src` | `'self' https://fonts.googleapis.com` | Self + Google Fonts CSS |
| `font-src` | `https://fonts.gstatic.com` | Google Fonts files only |
| `img-src` | `'self' data:` | Local images and inline data URIs |
| `connect-src` | `'none'` | No XHR, fetch, or WebSocket |
| `form-action` | `'none'` | No form submissions |
| `base-uri` | `'none'` | No `<base>` tag overrides |

**Implications for agents:** Do not add inline `<script>` or `<style>` tags, do not load external scripts or stylesheets from new origins, and do not add `fetch`/XHR calls — all of these will be blocked by the browser.

---

## Deployment

Push to `main` → GitHub Actions runs `.github/workflows/static.yml` → deploys to GitHub Pages. No build step needed; the workflow uploads the repo root as-is.

---

## Agent Tips

- **No async coordination needed.** All timing is `setTimeout`-based (300 ms for stone removal, 600 ms for AI "thinking"). If you're testing logic, you can call AI functions and `doTake()` directly without waiting.
- **`renderPiles()` is destructive.** It wipes `#piles-container` innerHTML completely on every call. Don't cache child elements across renders.
- **`startGame()` is the reset point.** It reads DOM values, not `state`, so calling it again picks up whatever is currently in the setup inputs.
- **Easy AI is not random — it's anti-optimal.** It enumerates all possible moves and deliberately picks ones that leave nim-sum ≠ 0. It only falls back to random-ish behavior when already in a losing position.
- **HvH mode ignores `difficulty`.** The `difficulty` field in state is set but `triggerAI()` is never called in HvH games.
- **Misère endgame is the only special case in `aiMove()`.** When all piles ≤ 1, the standard nim-sum strategy is wrong; `aiMove()` handles this explicitly before the nim-sum calculation.
- **Pile inputs are read at game start only.** Changes to `#pile-inputs` after `startGame()` has been called have no effect until the next `startGame()`.

---

## What Doesn't Exist (don't look for it)

- No backend, server, or API
- No npm / package manager
- No TypeScript, transpilation, or bundler
- No state persistence (localStorage, cookies, etc.)
- No multiplayer over network — HvH is same-device only

