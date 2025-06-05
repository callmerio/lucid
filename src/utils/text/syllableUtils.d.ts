/**
 * Type definitions for syllableUtils
 */

/**
 * Advanced syllable splitting function
 * @param word - The word to split into syllables
 * @returns Array of syllables
 */
export function advancedSyllabify(word: string): string[];

/**
 * Get syllable count for a word
 * @param word - The word to count syllables for
 * @returns Number of syllables
 */
export function getSyllableCount(word: string): number;

/**
 * Batch process multiple words for syllable splitting
 * @param words - Array of words to process
 * @returns Object mapping words to their syllable arrays
 */
export function batchSyllabify(words: string[]): Record<string, string[]>;
