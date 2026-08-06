export const RANKS = [
  { name: 'Iron 1', color: '#5b5b5b', minRating: 0, maxRating: 266, tier: 'Iron', subtier: 1 },
  { name: 'Iron 2', color: '#5b5b5b', minRating: 267, maxRating: 533, tier: 'Iron', subtier: 2 },
  { name: 'Iron 3', color: '#5b5b5b', minRating: 534, maxRating: 799, tier: 'Iron', subtier: 3 },
  
  { name: 'Bronze 1', color: '#9b715c', minRating: 800, maxRating: 866, tier: 'Bronze', subtier: 1 },
  { name: 'Bronze 2', color: '#9b715c', minRating: 867, maxRating: 933, tier: 'Bronze', subtier: 2 },
  { name: 'Bronze 3', color: '#9b715c', minRating: 934, maxRating: 999, tier: 'Bronze', subtier: 3 },
  
  { name: 'Silver 1', color: '#c0c0c0', minRating: 1000, maxRating: 1133, tier: 'Silver', subtier: 1 },
  { name: 'Silver 2', color: '#c0c0c0', minRating: 1134, maxRating: 1266, tier: 'Silver', subtier: 2 },
  { name: 'Silver 3', color: '#c0c0c0', minRating: 1267, maxRating: 1399, tier: 'Silver', subtier: 3 },
  
  { name: 'Gold 1', color: '#ffd700', minRating: 1400, maxRating: 1499, tier: 'Gold', subtier: 1 },
  { name: 'Gold 2', color: '#ffd700', minRating: 1500, maxRating: 1599, tier: 'Gold', subtier: 2 },
  { name: 'Gold 3', color: '#ffd700', minRating: 1600, maxRating: 1699, tier: 'Gold', subtier: 3 },
  
  { name: 'Platinum 1', color: '#00ced1', minRating: 1700, maxRating: 1799, tier: 'Platinum', subtier: 1 },
  { name: 'Platinum 2', color: '#00ced1', minRating: 1800, maxRating: 1899, tier: 'Platinum', subtier: 2 },
  { name: 'Platinum 3', color: '#00ced1', minRating: 1900, maxRating: 1999, tier: 'Platinum', subtier: 3 },
  
  { name: 'Diamond 1', color: '#b9f2ff', minRating: 2000, maxRating: 2099, tier: 'Diamond', subtier: 1 },
  { name: 'Diamond 2', color: '#b9f2ff', minRating: 2100, maxRating: 2199, tier: 'Diamond', subtier: 2 },
  { name: 'Diamond 3', color: '#b9f2ff', minRating: 2200, maxRating: 2299, tier: 'Diamond', subtier: 3 },
  
  { name: 'Ascendant 1', color: '#66bb6a', minRating: 2300, maxRating: 2399, tier: 'Ascendant', subtier: 1 },
  { name: 'Ascendant 2', color: '#66bb6a', minRating: 2400, maxRating: 2499, tier: 'Ascendant', subtier: 2 },
  { name: 'Ascendant 3', color: '#66bb6a', minRating: 2500, maxRating: 2599, tier: 'Ascendant', subtier: 3 },
  
  { name: 'Immortal 1', color: '#e53935', minRating: 2600, maxRating: 2699, tier: 'Immortal', subtier: 1 },
  { name: 'Immortal 2', color: '#e53935', minRating: 2700, maxRating: 2799, tier: 'Immortal', subtier: 2 },
  { name: 'Immortal 3', color: '#e53935', minRating: 2800, maxRating: 2899, tier: 'Immortal', subtier: 3 },
  
  { name: 'Radiant', color: '#ffeb3b', minRating: 2900, maxRating: 9999, tier: 'Radiant', subtier: 1 }
];

export function getRank(rating) {
  const r = Math.max(0, rating);
  for (const rank of RANKS) {
    if (r >= rank.minRating && r <= rank.maxRating) {
      return rank;
    }
  }
  return RANKS[RANKS.length - 1]; // Default to Radiant if somehow above 9999
}

export function getRankProgress(rating) {
  const rank = getRank(rating);
  if (rank.name === 'Radiant') return 100;
  
  const range = rank.maxRating - rank.minRating;
  const progress = rating - rank.minRating;
  return Math.round((progress / range) * 100);
}

export function applyRatingChange(currentRating, spi, mode, kFactor = 32) {
  let modeMultiplier = 1.0;
  if (mode === 'learning') modeMultiplier = 0.3;
  if (mode === 'contest') modeMultiplier = 1.5;
  
  const delta = kFactor * (spi - 1.0) * modeMultiplier;
  const newRating = Math.max(0, Math.round(currentRating + delta));
  
  const rankBefore = getRank(currentRating);
  const rankAfter = getRank(newRating);
  
  return {
    newRating,
    delta: Math.round(delta * 100) / 100, // rounded to 2 decimals
    rankBefore,
    rankAfter,
    rankChanged: rankBefore.name !== rankAfter.name
  };
}
