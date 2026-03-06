# Nim

A browser-playable implementation of the mathematical strategy game Nim. No build tools, no dependencies — just open `index.html`.

## How to Play

Open `index.html` in any modern browser. No server or install required.

On your turn, click a pile to select it, set how many stones to take, and click **Take Stones**. Players alternate until all stones are gone.

## Rules

**Normal** — the player who takes the last stone **wins**.

**Misère** — the player who takes the last stone **loses**.

Each turn you must take at least 1 stone, and all stones taken must come from the same pile.

## Modes

| Mode | Description |
|---|---|
| Human vs Human | Two players share the same browser |
| Human vs AI | Play against an optimal computer opponent |

## Setup Options

- **Piles**: 1–6 piles, each with 1–20 stones (default: 3 / 5 / 7)
- **Mode**: Human vs Human or Human vs AI
- **Variant**: Normal or Misère

## AI Strategy

The AI plays using the optimal Nim strategy based on the **nim-sum** (XOR of all pile sizes):

- If the nim-sum is non-zero, the AI finds a move that reduces it to zero, putting the opponent in a losing position.
- If the nim-sum is already zero (the AI is in a losing position), it takes 1 stone from the largest pile and waits for a mistake.
- In Misère mode, the strategy is identical to Normal Nim except in the endgame (when all remaining piles have ≤ 1 stone), where the goal inverts.

The AI will always win from a winning position with perfect play.

## Files

```
nim/
├── index.html   # Game markup
├── style.css    # Dark theme, layout, stone animations
└── game.js      # Game state, Nim logic, AI, rendering
```

## Tech Stack

Pure Vanilla JS — chosen because Nim's state is trivially small (an array of pile counts, a current-player index, a game-over flag). No framework runtime, no build step, no `node_modules`. The entire game is under 10 KB.
