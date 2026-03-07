// ── Game state ────────────────────────────────────────────────────────────────
const state = {
  piles: [],
  currentPlayer: 0,   // 0 = Player 1 / Human, 1 = Player 2 / AI
  selectedPile: null,
  mode: 'hvh',        // 'hvh' | 'hva'
  variant: 'normal',  // 'normal' | 'misere'
  difficulty: 'hard', // 'easy' | 'medium' | 'hard'
  over: false,
};

// ── Nim AI ────────────────────────────────────────────────────────────────────

/**
 * Returns the XOR (nim-sum) of all piles.
 * Position is losing for the player to move when nim-sum === 0.
 */
function nimSum(piles) {
  return piles.reduce((xor, n) => xor ^ n, 0);
}

/**
 * Optimal move for normal Nim: find a pile and a take-count that leaves
 * the opponent in a zero nim-sum (losing) position.
 * Falls back to taking 1 from the largest pile if already in losing position.
 *
 * For misère Nim the strategy is identical to normal Nim EXCEPT when all
 * remaining piles have size ≤ 1, where the goal flips.
 */
function aiMove(piles, variant) {
  const allSmall = piles.every(p => p <= 1);

  if (variant === 'misere' && allSmall) {
    // Take from a pile of 1 to leave an odd number of 1-piles for opponent
    const ones = piles.filter(p => p === 1).length;
    // We want to leave an even number of 1-piles (opponent takes last → they lose)
    const targetIdx = piles.findIndex(p => p === 1);
    if (ones % 2 === 0 && targetIdx !== -1) return { pile: targetIdx, take: 1 };
    // Already odd → take 1 from any pile of 1 to make even
    if (ones % 2 === 1 && targetIdx !== -1) return { pile: targetIdx, take: 1 };
    return fallback(piles);
  }

  const ns = nimSum(piles);
  if (ns !== 0) {
    for (let i = 0; i < piles.length; i++) {
      const target = piles[i] ^ ns;
      if (target < piles[i]) {
        return { pile: i, take: piles[i] - target };
      }
    }
  }
  return fallback(piles);
}

function fallback(piles) {
  // Losing position: take 1 from the largest non-empty pile
  let idx = 0;
  for (let i = 1; i < piles.length; i++) {
    if (piles[i] > piles[idx]) idx = i;
  }
  return { pile: idx, take: 1 };
}

/**
 * Easy difficulty: anti-optimal play.
 * Always tries to leave nim-sum ≠ 0, which puts the human in the winning
 * position. Since every Nim position is either a P-position (nim-sum = 0,
 * previous player wins) or an N-position (nim-sum ≠ 0, next player wins),
 * deliberately avoiding the winning move guarantees the human can always win
 * with correct play. When no anti-optimal move exists (AI is already in a
 * P-position), any move hands the advantage back to the human anyway.
 */
function aiMoveEasy(piles, variant) {
  const antiMoves = [];
  // ⚡ Bolt: Calculate current nim-sum once (O(N)) instead of recalculating
  // via O(N) array allocation on every possible move (O(N^2 * max_stones)).
  const currentNs = nimSum(piles);

  for (let i = 0; i < piles.length; i++) {
    if (piles[i] === 0) continue;
    for (let take = 1; take <= piles[i]; take++) {
      // ⚡ Bolt: A move changes exactly one pile, so the new nim-sum is
      // currentNs ^ old_pile_size ^ new_pile_size (O(1) calculation).
      const newNs = currentNs ^ piles[i] ^ (piles[i] - take);
      if (newNs !== 0) {
        antiMoves.push({ pile: i, take });
      }
    }
  }
  if (antiMoves.length > 0) {
    return antiMoves[Math.floor(Math.random() * antiMoves.length)];
  }
  // Already in a P-position — any move gives human the advantage
  return fallback(piles);
}

/**
 * Medium difficulty: plays randomly most of the time, but occasionally
 * executes the optimal strategy.
 */
function aiMoveMedium(piles, variant) {
  if (Math.random() < 0.3) {
    return aiMove(piles, variant);
  }
  const nonEmpty = piles.map((p, i) => i).filter(i => piles[i] > 0);
  const pile = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
  const take = Math.floor(Math.random() * piles[pile]) + 1;
  return { pile, take };
}

// ── Win detection ─────────────────────────────────────────────────────────────

function isGameOver(piles) {
  return piles.every(p => p === 0);
}

/**
 * Returns the index of the winner after the board is empty.
 * In normal Nim the player who just moved (took the last stone) wins.
 * In misère the player who just moved loses.
 * `lastPlayer` is the player who made the final move.
 */
function winner(lastPlayer, variant) {
  return variant === 'normal' ? lastPlayer : 1 - lastPlayer;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function playerName(idx) {
  if (state.mode === 'hva') return idx === 0 ? 'You' : 'AI';
  return `Player ${idx + 1}`;
}

function renderPiles(removingPile, removingCount) {
  const container = document.getElementById('piles-container');
  container.innerHTML = '';

  state.piles.forEach((count, i) => {
    const row = document.createElement('div');
    row.className = 'pile-row' +
      (count === 0 ? ' empty' : '') +
      (state.selectedPile === i ? ' selected' : '') +
      (state.over || (state.mode === 'hva' && state.currentPlayer === 1) ? ' disabled' : '');
    row.dataset.pile = i;

    const label = document.createElement('span');
    label.className = 'pile-label';
    label.textContent = `Pile ${i + 1}`;

    const stonesDiv = document.createElement('div');
    stonesDiv.className = 'stones';

    for (let s = 0; s < count; s++) {
      const stone = document.createElement('div');
      const isRemoving = removingPile === i && s >= count - removingCount;
      stone.className = 'stone' +
        (isRemoving ? ' removing' : '') +
        (state.selectedPile === i && !isRemoving ? ' selected-stone' : '');
      stonesDiv.appendChild(stone);
    }

    const countSpan = document.createElement('span');
    countSpan.className = 'pile-count';
    countSpan.textContent = count;

    row.appendChild(label);
    row.appendChild(stonesDiv);
    row.appendChild(countSpan);

    if (count > 0 && !state.over) {
      row.addEventListener('click', () => selectPile(i));
    }

    container.appendChild(row);
  });
}

function renderStatus() {
  const turnLabel = document.getElementById('turn-label');
  const variantLabel = document.getElementById('variant-label');
  turnLabel.textContent = state.over ? '' : `${playerName(state.currentPlayer)}'s turn`;
  variantLabel.textContent = state.variant === 'misere' ? 'Misère' : 'Normal';

  // Color the turn label: pink for AI, teal for human
  const isAI = state.mode === 'hva' && state.currentPlayer === 1;
  turnLabel.classList.toggle('ai-turn', isAI && !state.over);
}

function showResult(winnerIdx) {
  const banner = document.getElementById('result-banner');
  const text = document.getElementById('result-text');
  text.textContent = `${playerName(winnerIdx)} wins!`;
  banner.classList.remove('hidden');
  document.getElementById('controls').classList.add('hidden');
  document.getElementById('turn-label').textContent = '';
}

// ── Player actions ────────────────────────────────────────────────────────────

function selectPile(idx) {
  if (state.over) return;
  if (state.piles[idx] === 0) return;
  if (state.mode === 'hva' && state.currentPlayer === 1) return;

  state.selectedPile = idx;
  const maxTake = state.piles[idx];
  const input = document.getElementById('take-count');
  input.max = maxTake;
  if (parseInt(input.value) > maxTake) input.value = maxTake;

  document.getElementById('selected-pile-label').textContent = `Pile ${idx + 1}`;
  document.getElementById('take-btn').disabled = false;

  renderPiles();
}

function doTake(pileIdx, takeCount) {
  // Animate removal
  renderPiles(pileIdx, takeCount);

  // After animation, update state
  setTimeout(() => {
    const lastPlayer = state.currentPlayer;
    state.piles[pileIdx] -= takeCount;
    state.selectedPile = null;

    if (isGameOver(state.piles)) {
      state.over = true;
      renderPiles();
      renderStatus();
      showResult(winner(lastPlayer, state.variant));
      return;
    }

    state.currentPlayer = 1 - state.currentPlayer;
    document.getElementById('take-count').value = 1;
    document.getElementById('selected-pile-label').textContent = '—';
    document.getElementById('take-btn').disabled = true;
    renderPiles();
    renderStatus();

    if (state.mode === 'hva' && state.currentPlayer === 1) {
      triggerAI();
    }
  }, 300);
}

function triggerAI() {
  document.getElementById('game').classList.add('ai-thinking');
  setTimeout(() => {
    document.getElementById('game').classList.remove('ai-thinking');
    let move;
    if (state.difficulty === 'easy') {
      move = aiMoveEasy(state.piles, state.variant);
    } else if (state.difficulty === 'medium') {
      move = aiMoveMedium(state.piles, state.variant);
    } else {
      move = aiMove(state.piles, state.variant);
    }
    doTake(move.pile, move.take);
  }, 600);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function startGame() {
  const inputs = document.querySelectorAll('.pile-input');
  const piles = Array.from(inputs).map(el => Math.max(1, Math.min(20, parseInt(el.value) || 1)));

  state.piles = piles;
  state.currentPlayer = 0;
  state.selectedPile = null;
  state.mode = document.getElementById('mode-select').value;
  state.variant = document.getElementById('variant-select').value;
  state.difficulty = document.getElementById('difficulty-select').value;
  state.over = false;

  document.getElementById('setup').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  document.getElementById('result-banner').classList.add('hidden');
  document.getElementById('controls').classList.remove('hidden');
  document.getElementById('take-count').value = 1;
  document.getElementById('take-btn').disabled = true;
  document.getElementById('selected-pile-label').textContent = '—';

  renderPiles();
  renderStatus();
}

// ── Event listeners ───────────────────────────────────────────────────────────

document.getElementById('mode-select').addEventListener('change', () => {
  const isAI = document.getElementById('mode-select').value === 'hva';
  document.getElementById('difficulty-setting').classList.toggle('hidden', !isAI);
});

document.getElementById('start-game').addEventListener('click', startGame);

document.getElementById('play-again').addEventListener('click', startGame);

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('game').classList.add('hidden');
  document.getElementById('setup').classList.remove('hidden');
});

document.getElementById('take-btn').addEventListener('click', () => {
  if (state.selectedPile === null) return;
  const take = Math.max(1, Math.min(
    state.piles[state.selectedPile],
    parseInt(document.getElementById('take-count').value) || 1
  ));
  doTake(state.selectedPile, take);
});

document.getElementById('take-count').addEventListener('input', () => {
  if (state.selectedPile === null) return;
  const max = state.piles[state.selectedPile];
  const val = parseInt(document.getElementById('take-count').value) || 1;
  // Highlight stones that will be taken
  renderPiles(state.selectedPile, Math.min(val, max));
});

document.getElementById('add-pile').addEventListener('click', () => {
  const inputs = document.getElementById('pile-inputs');
  if (inputs.children.length >= 6) return;
  const el = document.createElement('input');
  el.type = 'number';
  el.className = 'pile-input';
  el.min = 1;
  el.max = 20;
  el.value = 5;
  inputs.appendChild(el);
});

document.getElementById('remove-pile').addEventListener('click', () => {
  const inputs = document.getElementById('pile-inputs');
  if (inputs.children.length <= 1) return;
  inputs.removeChild(inputs.lastChild);
});
