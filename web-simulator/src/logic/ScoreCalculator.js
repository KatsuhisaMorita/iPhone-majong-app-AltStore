// ScoreCalculator - exact port of Swift ScoreCalculator
// This must produce identical results to the Swift version

/**
 * @param {Array} inputs - [{ playerId, rawScore, chipCount, tieBreakerRank }]
 * @param {Object} settings - RuleSettings instance
 * @param {Object} [tobiOptions] - Optional manual tobi control
 *   { applyTobi: boolean, tobiPlayerIds: string[], tobiWinnerId: string }
 *   - applyTobi: true to apply tobi penalties/bonuses
 *   - tobiPlayerIds: player IDs who are "飛んだ" (get penalty)
 *   - tobiWinnerId: player ID who receives the bonus
 *   If omitted, falls back to auto behavior (rawScore < 0)
 * @returns {Array<{ playerId, finalScore, rank }>}
 */
export function calculate(inputs, settings, tobiOptions = null) {
  if (inputs.length !== 4) {
    throw new Error('Require exactly 4 players');
  }

  // 1. Calculate points after 30000 return and rounding (五捨六入)
  let preUmaScores = inputs.map(input => ({
    playerId: input.playerId,
    points: calculatePoints(input.rawScore, settings.targetScore),
    rawScore: input.rawScore,
    tieBreaker: input.tieBreakerRank ?? null
  }));

  // 2. Sort by rawScore descending, then tieBreakerRank ascending
  preUmaScores.sort((a, b) => {
    if (a.rawScore !== b.rawScore) {
      return b.rawScore - a.rawScore;
    }
    return (a.tieBreaker ?? 4) - (b.tieBreaker ?? 4);
  });

  // 3. Apply Oka, Uma, and Tobi
  const totalPreUmaPoints = preUmaScores.reduce((sum, p) => sum + p.points, 0);
  const oka = -totalPreUmaPoints; // The missing points (usually +20 for 1st place)

  const umas = [settings.umaFirst, settings.umaSecond, -settings.umaSecond, -settings.umaFirst];

  const results = [];

  for (let i = 0; i < preUmaScores.length; i++) {
    const p = preUmaScores[i];
    let finalPoints = p.points;

    // Apply Oka to 1st place
    if (i === 0) {
      finalPoints += oka;
    }

    // Apply Uma
    finalPoints += umas[i];

    // Apply Tobi
    if (settings.isTobiEnabled) {
      if (tobiOptions) {
        // Manual tobi: user explicitly chose who gets tobi
        if (tobiOptions.applyTobi) {
          if (tobiOptions.tobiPlayerIds.includes(p.playerId)) {
            finalPoints -= settings.tobiPenalty;
          }
          if (p.playerId === tobiOptions.tobiWinnerId) {
            finalPoints += tobiOptions.tobiPlayerIds.length * settings.tobiBonus;
          }
        }
      } else {
        // Auto tobi (legacy): rawScore < 0 triggers penalty
        if (p.rawScore < 0) {
          finalPoints -= settings.tobiPenalty;
        }
        if (i === 0) {
          const tobiCount = preUmaScores.filter(s => s.rawScore < 0).length;
          finalPoints += tobiCount * settings.tobiBonus;
        }
      }
    }

    // Apply Chips
    const inputEntry = inputs.find(inp => inp.playerId === p.playerId);
    finalPoints += (inputEntry?.chipCount ?? 0) * settings.chipRate;

    results.push({
      playerId: p.playerId,
      finalScore: finalPoints,
      rank: i + 1
    });
  }

  return results;
}

/**
 * 五捨六入 (Go-sha Roku-nyu)
 * Exact port of Swift calculatePoints
 */
export function calculatePoints(rawScore, targetScore) {
  const diff = rawScore - targetScore;

  const remainder = Math.abs(diff) % 1000;
  let pointsBase = Math.trunc(diff / 1000);

  if (diff >= 0) {
    if (remainder > 500) {
      pointsBase += 1;
    }
  } else {
    if (remainder > 500) {
      pointsBase -= 1;
    }
  }

  return pointsBase || 0; // Convert -0 to 0 (match Swift Int behavior)
}
