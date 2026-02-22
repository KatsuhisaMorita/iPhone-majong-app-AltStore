// ScoreCalculator tests - verifies JS port matches Swift behavior
import { describe, it, expect } from 'vitest';
import { calculate, calculatePoints } from '../src/logic/ScoreCalculator.js';

describe('calculatePoints (五捨六入)', () => {
  const target = 30000;

  it('正の差: 35000 -> +5', () => {
    expect(calculatePoints(35000, target)).toBe(5);
  });

  it('負の差: 25000 -> -5', () => {
    expect(calculatePoints(25000, target)).toBe(-5);
  });

  it('ちょうど: 30000 -> 0', () => {
    expect(calculatePoints(30000, target)).toBe(0);
  });

  it('五捨: 30500 -> +0 (remainder 500, not > 500)', () => {
    expect(calculatePoints(30500, target)).toBe(0);
  });

  it('六入: 30600 -> +1 (remainder 600, > 500)', () => {
    expect(calculatePoints(30600, target)).toBe(1);
  });

  it('負の五捨: 29500 -> 0 (remainder 500)', () => {
    expect(calculatePoints(29500, target)).toBe(0);
  });

  it('負の六入: 29400 -> -1 (remainder 600)', () => {
    expect(calculatePoints(29400, target)).toBe(-1);
  });

  it('マイナス点: -1000 -> -31', () => {
    expect(calculatePoints(-1000, target)).toBe(-31);
  });

  it('大きい値: 50000 -> +20', () => {
    expect(calculatePoints(50000, target)).toBe(20);
  });
});

describe('calculate (full score calculation)', () => {
  const defaultSettings = {
    targetScore: 30000,
    baseScore: 25000,
    umaFirst: 30,
    umaSecond: 10,
    isTobiEnabled: true,
    tobiBonus: 10,
    tobiPenalty: 10,
    chipRate: 2
  };

  it('標準的な半荘結果 (合計100000)', () => {
    const inputs = [
      { playerId: 'a', rawScore: 40000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 20000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: 10000, chipCount: 0, tieBreakerRank: null },
    ];

    const results = calculate(inputs, defaultSettings);

    // 1st: a (40000)
    expect(results[0].playerId).toBe('a');
    expect(results[0].rank).toBe(1);

    // 4th: d (10000)
    expect(results[3].playerId).toBe('d');
    expect(results[3].rank).toBe(4);

    // Total should be 0 (excluding chips)
    const total = results.reduce((sum, r) => sum + r.finalScore, 0);
    expect(total).toBeCloseTo(0, 5);
  });

  it('プレイヤー数が4でない場合にエラー', () => {
    expect(() => calculate([], defaultSettings)).toThrow('Require exactly 4 players');
    expect(() => calculate([{ playerId: 'a', rawScore: 25000, chipCount: 0 }], defaultSettings)).toThrow();
  });

  it('同着時のタイブレーカー', () => {
    const inputs = [
      { playerId: 'a', rawScore: 25000, chipCount: 0, tieBreakerRank: 1 },
      { playerId: 'b', rawScore: 25000, chipCount: 0, tieBreakerRank: 2 },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: 3 },
      { playerId: 'd', rawScore: 25000, chipCount: 0, tieBreakerRank: 4 },
    ];

    const results = calculate(inputs, defaultSettings);

    // tieBreakerRank 1 should be ranked 1st
    expect(results.find(r => r.playerId === 'a').rank).toBe(1);
    expect(results.find(r => r.playerId === 'd').rank).toBe(4);
  });

  it('飛び賞 (マイナス点)', () => {
    const inputs = [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ];

    const results = calculate(inputs, defaultSettings);
    const firstPlace = results.find(r => r.rank === 1);
    const lastPlace = results.find(r => r.rank === 4);

    // 1st place should get tobi bonus
    // 4th place should get tobi penalty
    expect(lastPlace.playerId).toBe('d');
    // d has rawScore -5000, so tobi penalty applies
  });

  it('チップ計算', () => {
    const inputs = [
      { playerId: 'a', rawScore: 25000, chipCount: 5, tieBreakerRank: null },
      { playerId: 'b', rawScore: 25000, chipCount: -5, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 3, tieBreakerRank: null },
      { playerId: 'd', rawScore: 25000, chipCount: -3, tieBreakerRank: null },
    ];

    const settingsWithChips = { ...defaultSettings };
    const results = calculate(inputs, settingsWithChips);

    // a should have +10 from chips (5 * 2)
    const aResult = results.find(r => r.playerId === 'a');
    // chipCount * chipRate = 5 * 2 = 10 extra
    expect(aResult.finalScore).toBeGreaterThan(results.find(r => r.playerId === 'b').finalScore);
  });

  it('飛び賞無効', () => {
    const settingsNoTobi = { ...defaultSettings, isTobiEnabled: false };
    const inputs = [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ];

    const withTobi = calculate(inputs, defaultSettings);
    const withoutTobi = calculate(inputs, settingsNoTobi);

    // Results should differ due to tobi being applied/not
    const firstWithTobi = withTobi.find(r => r.rank === 1).finalScore;
    const firstWithoutTobi = withoutTobi.find(r => r.rank === 1).finalScore;
    expect(firstWithTobi).not.toBe(firstWithoutTobi);
  });

  it('手動飛び賞: 流局で飛び賞なし (applyTobi=false)', () => {
    const inputs = [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ];

    const tobiOptions = { applyTobi: false, tobiPlayerIds: ['d'], tobiWinnerId: null };
    const results = calculate(inputs, defaultSettings, tobiOptions);

    // Without tobi, 'd' should NOT get the penalty and 'a' should NOT get the bonus
    const noTobiSettings = { ...defaultSettings, isTobiEnabled: false };
    const resultsNoTobi = calculate(inputs, noTobiSettings);

    // Should match results with tobi disabled entirely
    expect(results.find(r => r.playerId === 'a').finalScore)
      .toBe(resultsNoTobi.find(r => r.playerId === 'a').finalScore);
    expect(results.find(r => r.playerId === 'd').finalScore)
      .toBe(resultsNoTobi.find(r => r.playerId === 'd').finalScore);
  });

  it('手動飛び賞: 特定プレイヤーが獲得 (applyTobi=true, custom winner)', () => {
    const inputs = [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ];

    // 'b' gets the tobi bonus instead of auto-1st-place
    const tobiOptions = { applyTobi: true, tobiPlayerIds: ['d'], tobiWinnerId: 'b' };
    const results = calculate(inputs, defaultSettings, tobiOptions);

    // 'd' should get penalty
    const autoResults = calculate(inputs, defaultSettings);
    const dManual = results.find(r => r.playerId === 'd').finalScore;
    const dAuto = autoResults.find(r => r.playerId === 'd').finalScore;
    expect(dManual).toBe(dAuto); // penalty is the same

    // 'b' should get the bonus, not 'a'
    const bManual = results.find(r => r.playerId === 'b').finalScore;
    const bAuto = autoResults.find(r => r.playerId === 'b').finalScore;
    expect(bManual).toBeGreaterThan(bAuto); // b got the bonus

    const aManual = results.find(r => r.playerId === 'a').finalScore;
    const aAuto = autoResults.find(r => r.playerId === 'a').finalScore;
    expect(aManual).toBeLessThan(aAuto); // a didn't get the bonus
  });
});
