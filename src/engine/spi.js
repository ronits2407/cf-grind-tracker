import { DB } from '../storage/db.js';
import { Settings } from '../storage/settings.js';

export function getRatingMultiplier(rating) {
  let multiplier = 0.5 + (rating / 1800);
  return Math.min(multiplier, 2.0);
}

export function getPenaltyFactor(wrongCount) {
  return Math.pow(0.9, wrongCount);
}

export async function getAvgSolveTime(problemRating, db) {
  let problems = await db.getProblemsByRating(problemRating, 0);
  
  if (problems.length >= 5) {
    const avgTime = problems.reduce((sum, p) => sum + p.solveTime, 0) / problems.length;
    return { avgTime, confidence: 'high', sampleSize: problems.length };
  }
  
  problems = await db.getProblemsByRating(problemRating, 100);
  if (problems.length >= 5) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const p of problems) {
      const diff = Math.abs(p.rating - problemRating);
      const weight = diff === 0 ? 1 : 0.7; // simple weight by proximity
      weightedSum += p.solveTime * weight;
      weightTotal += weight;
    }
    return { avgTime: weightedSum / weightTotal, confidence: 'medium', sampleSize: problems.length };
  }
  
  problems = await db.getProblemsByRating(problemRating, 200);
  if (problems.length >= 5) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const p of problems) {
      const diff = Math.abs(p.rating - problemRating);
      const weight = diff === 0 ? 1 : (diff <= 100 ? 0.7 : 0.4);
      weightedSum += p.solveTime * weight;
      weightTotal += weight;
    }
    return { avgTime: weightedSum / weightTotal, confidence: 'low', sampleSize: problems.length };
  }
  
  // Default fallback if not enough data
  // Assuming generic solve time based on rating
  const defaultBaseTime = 10 * 60 * 1000; // 10 minutes for 800
  const additionalTime = Math.max(0, problemRating - 800) * 1.5 * 1000;
  return { avgTime: defaultBaseTime + additionalTime, confidence: 'low', sampleSize: problems.length };
}

export async function calculateSPI(problemRating, solveTimeMs, wrongSubmissions, aiUsed, db) {
  const { avgTime, confidence } = await getAvgSolveTime(problemRating, db);
  
  let confidenceWeight = 1.0;
  if (confidence === 'medium') confidenceWeight = 0.7;
  if (confidence === 'low') confidenceWeight = 0.4;
  
  const ratingMultiplier = getRatingMultiplier(problemRating);
  const penaltyFactor = getPenaltyFactor(wrongSubmissions);
  
  let spi = (avgTime / solveTimeMs) * ratingMultiplier * penaltyFactor * confidenceWeight;
  
  if (aiUsed) {
    const settings = new Settings();
    const aiCapSPI = await settings.get('aiCapSPI');
    spi = Math.min(spi, aiCapSPI);
  }
  
  return spi;
}
