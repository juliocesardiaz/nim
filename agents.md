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
└── .github/workflows/static.yml     # GitHub Pages deploy on push to main
```

There is no `package.json`, no build step, no test suite.

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
  difficulty: 'easy' | 'medium' | 'hard',
  over: boolean
}
```

### AI (`game.js:12–104`)

| Function | Difficulty | Behaviour |
|---|---|---|
| `nimSum(piles)` | — | XOR of all pile sizes; 0 = losing position for current player |
| `aiMove(piles, variant)` | Hard | Optimal: reduces nim-sum to 0; handles Misère endgame |
| `aiMoveEasy(piles, variant)` | Easy | Anti-optimal: deliberately avoids winning moves |
| `aiMoveMedium(piles, variant)` | Medium | Random 70% of the time, optimal 30% |
| `fallback(piles)` | — | Takes 1 from largest pile; used when already losing |

### Win Detection (`game.js:106–120`)

- `isGameOver(piles)` — true when all piles are 0
- `winner(lastPlayer, variant)` — Normal: last mover wins; Misère: last mover loses

### Rendering (`game.js:122–191`)

- `renderPiles(removingPile?, removingCount?)` — rebuilds the pile DOM; pass args during animation
- `renderStatus()` — updates turn label (teal = human, pink = AI) and variant label
- `showResult(winnerIdx)` — shows result banner, hides controls

### Player Actions (`game.js:193–257`)

- `selectPile(idx)` — called on pile click; validates it's the human's turn
- `doTake(pileIdx, takeCount)` — executes a move; animates (300 ms), then updates state and switches player; triggers `triggerAI()` if it's the AI's turn
- `triggerAI()` — adds thinking indicator, waits 600 ms, then calls the appropriate AI function and calls `doTake()`

### Setup (`game.js:259–334`)

- `startGame()` — reads pile inputs and dropdowns, resets state, switches view from `#setup` to `#game`
- Event listeners for mode/variant/difficulty selectors, add/remove pile buttons, take-stones button, play-again and back buttons

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
| `#piles-container` | Rebuilt on every render |
| `#turn-label` | Current player indicator |
| `#variant-label` | "Normal" or "Misère" |
| `#result-banner` | Win/lose message |
| `#controls` | Take-stones form |
| `#take-count` | Stone count input |
| `#take-btn` | Submit move |
| `#selected-pile-label` | Shows which pile is selected |
| `#mode-select` | `'hvh'` / `'hva'` |
| `#variant-select` | `'normal'` / `'misere'` |
| `#difficulty-select` | `'easy'` / `'medium'` / `'hard'` |
| `#difficulty-setting` | Wrapper hidden in HvH mode |
| `#pile-inputs` | Container for pile count inputs |
| `#add-pile` / `#remove-pile` | Add/remove pile inputs (1–6 limit) |
| `#start-game` | Launches game from setup |
| `#play-again` | Restarts with same config |
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

## Deployment

Push to `main` → GitHub Actions runs `.github/workflows/static.yml` → deploys to GitHub Pages. No build step needed; the workflow uploads the repo root as-is.

---

## What Doesn't Exist (don't look for it)

- No backend, server, or API
- No npm / package manager
- No test suite
- No TypeScript, transpilation, or bundler
- No state persistence (localStorage, cookies, etc.)
- No multiplayer over network — HvH is same-device only
