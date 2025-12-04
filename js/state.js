// js/state.js - Centralized state management for the application

// Holds the result of the last successful Jukugo search (for click handling)
export const jukugoState = {
    // The Hiragana reading used to find the Jukugo (e.g., 'しない')
    lastReading: null,
    // A Set of kanji characters found in Jukugo words matching lastReading (e.g., Set('竹', '刀'))
    matchingKanji: new Set(),
};

/**
 * Updates the Jukugo state after a successful search.
 * @param {string} reading - The Hiragana reading used for the search.
 * @param {string[]} kanjiArray - Array of kanji characters found.
 */
export function setJukugoState(reading, kanjiArray) {
    jukugoState.lastReading = reading;
    jukugoState.matchingKanji = new Set(kanjiArray);
}

/**
 * Clears the Jukugo state.
 */
export function clearJukugoState() {
    jukugoState.lastReading = null;
    jukugoState.matchingKanji = new Set();
}