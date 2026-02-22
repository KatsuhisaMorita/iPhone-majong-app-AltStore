#!/usr/bin/env node
// sync-check.js - Verifies JS ScoreCalculator produces same results as Swift version
// Run: node scripts/sync-check.js

// This script runs a set of known test vectors and compares outputs.
// The same test vectors should be used in Swift unit tests.

import { calculate, calculatePoints } from '../src/logic/ScoreCalculator.js';

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

// Test vectors (same values used in Swift tests)
const testVectors = [
  {
    name: '標準半荘',
    inputs: [
      { playerId: 'a', rawScore: 40000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 20000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: 10000, chipCount: 0, tieBreakerRank: null },
    ],
    tobiOptions: null,
    expected: { totalZero: true, aRank: 1, dRank: 4 }
  },
  {
    name: '飛び賞あり (自動)',
    inputs: [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ],
    tobiOptions: null,
    expected: { dRank: 4 }
  },
  {
    name: '飛び賞スキップ (流局)',
    inputs: [
      { playerId: 'a', rawScore: 50000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'b', rawScore: 30000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'c', rawScore: 25000, chipCount: 0, tieBreakerRank: null },
      { playerId: 'd', rawScore: -5000, chipCount: 0, tieBreakerRank: null },
    ],
    tobiOptions: { applyTobi: false, tobiPlayerIds: ['d'], tobiWinnerId: null },
    expected: { dRank: 4 }
  },
  {
    name: '五捨六入',
    pointTests: [
      { raw: 35000, target: 30000, expected: 5 },
      { raw: 25000, target: 30000, expected: -5 },
      { raw: 30000, target: 30000, expected: 0 },
      { raw: 30500, target: 30000, expected: 0 },
      { raw: 30600, target: 30000, expected: 1 },
      { raw: 29400, target: 30000, expected: -1 },
      { raw: -1000, target: 30000, expected: -31 },
      { raw: 50000, target: 30000, expected: 20 },
    ]
  }
];

let passed = 0;
let failed = 0;

for (const tv of testVectors) {
  if (tv.pointTests) {
    for (const pt of tv.pointTests) {
      const result = calculatePoints(pt.raw, pt.target);
      if (result === pt.expected) {
        passed++;
      } else {
        console.error(`FAIL: calculatePoints(${pt.raw}, ${pt.target}) = ${result}, expected ${pt.expected}`);
        failed++;
      }
    }
    continue;
  }

  const results = calculate(tv.inputs, defaultSettings, tv.tobiOptions);

  if (tv.expected.totalZero) {
    const total = results.reduce((sum, r) => sum + r.finalScore, 0);
    if (Math.abs(total) > 0.001) {
      console.error(`FAIL [${tv.name}]: total != 0 (got ${total})`);
      failed++;
    } else {
      passed++;
    }
  }
  if (tv.expected.aRank !== undefined) {
    const aResult = results.find(r => r.playerId === 'a');
    if (aResult?.rank === tv.expected.aRank) { passed++; }
    else { console.error(`FAIL [${tv.name}]: a.rank = ${aResult?.rank}, expected ${tv.expected.aRank}`); failed++; }
  }
  if (tv.expected.dRank !== undefined) {
    const dResult = results.find(r => r.playerId === 'd');
    if (dResult?.rank === tv.expected.dRank) { passed++; }
    else { console.error(`FAIL [${tv.name}]: d.rank = ${dResult?.rank}, expected ${tv.expected.dRank}`); failed++; }
  }
}

console.log(`\nSync Check Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
