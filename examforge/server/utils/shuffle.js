/**
 * Utilities for option shuffling and access code generation.
 *
 * Uses mulberry32 — a small, fast, well-distributed PRNG seeded with a 32-bit integer.
 * This allows deterministic shuffles: given the same seed, the same shuffle order
 * is always produced — critical for re-grading after shuffled submission.
 */

/**
 * mulberry32 PRNG factory.
 * Returns a function that, when called, returns a float in [0, 1).
 * @param {number} seed - 32-bit unsigned integer seed
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates shuffle.
 * Returns a NEW array (does not mutate the original).
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Integer seed for the PRNG
 * @returns {Array} Shuffled copy of the array
 */
function seededShuffle(array, seed) {
  const arr = [...array];
  const rand = mulberry32(seed >>> 0); // Ensure unsigned 32-bit
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Given a student's submission seed and a question index, compute the shuffled
 * option order for that question.
 *
 * The combined seed is: (submissionSeed + questionIndex) % 2^32
 *
 * Returns an array of original indices in shuffled order.
 * E.g. [2, 0, 3, 1] means:
 *   - shuffled position 0 = original option 2
 *   - shuffled position 1 = original option 0
 *   etc.
 *
 * @param {number} submissionSeed
 * @param {number} questionIndex
 * @returns {number[]} mapping of shuffledPosition → originalIndex
 */
function getShuffleMap(submissionSeed, questionIndex) {
  const seed = (submissionSeed + questionIndex) >>> 0;
  return seededShuffle([0, 1, 2, 3], seed);
}

/**
 * Given a student's selected shuffled index and the shuffle map,
 * returns the original (correct) index in the question's options array.
 *
 * @param {number} selectedShuffledIndex - What the student selected (0-3)
 * @param {number[]} shuffleMap - Output of getShuffleMap()
 * @returns {number} Original option index
 */
function unshuffleIndex(selectedShuffledIndex, shuffleMap) {
  if (selectedShuffledIndex < 0 || selectedShuffledIndex > 3) return -1;
  return shuffleMap[selectedShuffledIndex];
}

/**
 * Generate a random 6-character uppercase alphanumeric access code.
 * Used for both Exam and Poll access codes.
 */
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = { mulberry32, seededShuffle, getShuffleMap, unshuffleIndex, generateAccessCode };
