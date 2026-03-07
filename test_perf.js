function nimSum(piles) {
  return piles.reduce((xor, n) => xor ^ n, 0);
}

function aiMoveEasyOld(piles) {
  const antiMoves = [];
  for (let i = 0; i < piles.length; i++) {
    if (piles[i] === 0) continue;
    for (let take = 1; take <= piles[i]; take++) {
      const after = piles.map((p, j) => j === i ? p - take : p);
      if (nimSum(after) !== 0) {
        antiMoves.push({ pile: i, take });
      }
    }
  }
  return antiMoves.length;
}

function aiMoveEasyNew(piles) {
  const antiMoves = [];
  const currentNs = nimSum(piles);
  for (let i = 0; i < piles.length; i++) {
    if (piles[i] === 0) continue;
    for (let take = 1; take <= piles[i]; take++) {
      const newNs = currentNs ^ piles[i] ^ (piles[i] - take);
      if (newNs !== 0) {
        antiMoves.push({ pile: i, take });
      }
    }
  }
  return antiMoves.length;
}

const largePiles = Array.from({length: 6}, () => 20);

console.time('Old Logic (100,000 iterations)');
for(let i=0; i<100000; i++) {
  aiMoveEasyOld(largePiles);
}
console.timeEnd('Old Logic (100,000 iterations)');

console.time('New Logic (100,000 iterations)');
for(let i=0; i<100000; i++) {
  aiMoveEasyNew(largePiles);
}
console.timeEnd('New Logic (100,000 iterations)');
