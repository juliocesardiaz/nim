function nimSum(piles) {
  return piles.reduce((xor, n) => xor ^ n, 0);
}

const piles = [3, 5, 7];
const currentNs = nimSum(piles);

for (let i = 0; i < piles.length; i++) {
  for (let take = 1; take <= piles[i]; take++) {
    const after = piles.map((p, j) => j === i ? p - take : p);
    const nsOld = nimSum(after);
    const nsNew = currentNs ^ piles[i] ^ (piles[i] - take);
    if (nsOld !== nsNew) {
      console.log(`Mismatch at pile ${i}, take ${take}: old=${nsOld}, new=${nsNew}`);
    }
  }
}
console.log("Test finished.");
