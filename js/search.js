// js/search.js - Handles search and filtering functionality with WanaKana and Jukugo support 

import { DOM_IDS } from './config.js';
import { searchJukugoInWorker, isJMDictLoaded } from './dataLoader.js';
import { getMasterKanjiList, renderListToDOM } from './kanjiGrid.js';
import { setJukugoState, clearJukugoState } from './state.js'; // <-- NEW IMPORT

let debounceTimer;

/** * Check if query matches word exactly (not as substring).
 * @param {string} text - The text to search in 
 * @param {string} query - The query to search for 
 * @returns {boolean} - True if exact match found 
 */
function hasExactWord(text, query) {
    if (!text || !query) return false;

    // Split by non-word characters (spaces, punctuation, etc.) 
    const words = text.toLowerCase().split(/\W+/);
    return words.some(word => word === query.toLowerCase());
}

/** * Check if query matches Japanese reading exactly.
 * Handles both hiragana and katakana variations 
 * @param {string[]} readings - Array of readings 
 * @param {string} query - The query to search for 
 * @returns {boolean} - True if exact match found 
 */
function hasExactReading(readings, query) {
    if (!readings || !query || typeof wanakana === 'undefined') return false;

    const normalizedQuery = query.toLowerCase();
    return readings.some(reading =>
        reading.toLowerCase() === normalizedQuery ||
        wanakana.toHiragana(reading) === wanakana.toHiragana(normalizedQuery) ||
        wanakana.toKatakana(reading) === wanakana.toKatakana(normalizedQuery)
    );
}

/** * Handle checkbox change for reading type filters 
 * Includes mutual exclusion and WanaKana binding 
 */
export function handleCheckboxChange(type) {
    const input = document.getElementById(DOM_IDS.kanjiSearchInput);
    const onCheck = document.getElementById(DOM_IDS.onyomiCheckbox);
    const kunCheck = document.getElementById(DOM_IDS.kunyomiCheckbox);
    const currentVal = input.value;

    if (!input || !onCheck || !kunCheck) return;

    // 1. Mutual Exclusion Logic 
    if (type === 'onyomi' && onCheck.checked) {
        kunCheck.checked = false;
    } else if (type === 'kunyomi' && kunCheck.checked) {
        onCheck.checked = false;
    }

    // 2. Safely Unbind WanaKana 
    try {
        if (window.wanakana) wanakana.unbind(input);
    } catch (e) { /* Ignore */ }

    // 3. Apply WanaKana Logic based on state 
    if (onCheck.checked) {
        if (window.wanakana) {
            // Convert existing text to Katakana immediately 
            input.value = wanakana.toKatakana(currentVal);
            // Bind for future typing 
            wanakana.bind(input, { IMEMode: 'toKatakana' });
        }
        input.placeholder = "Type in Romaji → カタカナ";
    }
    else if (kunCheck.checked) {
        if (window.wanakana) {
            // Convert existing text to Hiragana immediately 
            input.value = wanakana.toHiragana(currentVal);
            // Bind for future typing 
            wanakana.bind(input, { IMEMode: 'toHiragana' });
        }
        input.placeholder = "Type in Romaji → ひらがな";
    }
    else {
        // No checkboxes: Standard input 
        input.placeholder = "Type meaning or reading...";
    }

    // Re-run filter immediately in case the text changed format 
    filterGrid();
}

/**
 * Entry point for search input events (debounced)
 */
export function filterGrid() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerSearch, 150);
}

/**
 * Initiates the search, handling Jukugo asynchronously, then performs filtering.
 */
function triggerSearch() {
    const rawQuery = document.getElementById(DOM_IDS.kanjiSearchInput).value.trim();
    const query = rawQuery.toLowerCase();

    // If no query, reset view
    if (!query) {
        document.getElementById(DOM_IDS.jukugoPanel).style.display = 'none';
        clearJukugoState(); // <-- Clear Jukugo state on empty search
        renderListToDOM(getMasterKanjiList());
        return;
    }

    // Check if JMDict is loaded and if WanaKana is available
    if (isJMDictLoaded() && window.wanakana) {
        const hiraganaQuery = wanakana.toHiragana(rawQuery);

        // Asynchronously search for Jukugo kanji
        searchJukugoInWorker(hiraganaQuery, (jukugoKanjiArray) => {
            const jukugoKanji = new Set(jukugoKanjiArray);

            if (jukugoKanji.size > 0) {
                // *** CHANGE: Save state instead of auto-displaying panel ***
                setJukugoState(hiraganaQuery, jukugoKanjiArray);
            } else {
                document.getElementById(DOM_IDS.jukugoPanel).style.display = 'none';
                clearJukugoState(); // <-- Clear state if search fails
            }

            // Perform the main array filtering
            performFiltering(query, rawQuery, jukugoKanji);
        });

    } else {
        // If JMDict is not ready, filter synchronously without Jukugo
        document.getElementById(DOM_IDS.jukugoPanel).style.display = 'none';
        clearJukugoState(); // <-- Clear state
        performFiltering(query, rawQuery, new Set());
    }
}

/**
 * Performs the actual filtering on the master list using the high-fidelity rules.
 * @param {string} query - Lowercase search query
 * @param {string} rawQuery - Original search query
 * @param {Set<string>} jukugoKanji - Kanji characters matching the Jukugo reading.
 */
function performFiltering(query, rawQuery, jukugoKanji) {
    const masterList = getMasterKanjiList();
    const onCheck = document.getElementById(DOM_IDS.onyomiCheckbox).checked;
    const kunCheck = document.getElementById(DOM_IDS.kunyomiCheckbox).checked;

    const filteredList = masterList.filter(item => {
        const kanji = item.kanji;
        const searchData = item.keywords;
        const data = Kanji.getDetails(kanji);

        if (!data) return false;

        // PRIORITY 1: If matches jukugo, always show 
        if (jukugoKanji.has(kanji)) {
            return true;
        }

        // PRIORITY 2: Exact Match on the Kanji Character itself (e.g., search '日')
        if (kanji === rawQuery) return true;

        const meaningsStr = data.meanings ? data.meanings.join(' ') : '';

        if (onCheck) {
            // Onyomi mode: check if query is in onyomi readings or exact meaning match
            if (hasExactReading(data.onyomi, rawQuery)) return true;
            if (hasExactWord(meaningsStr, query)) return true;
            return false;
        }

        if (kunCheck) {
            // Kunyomi mode: check if query is in kunyomi readings or exact meaning match
            if (hasExactReading(data.kunyomi, rawQuery)) return true;
            if (hasExactWord(meaningsStr, query)) return true;
            return false;
        }

        // Default (No checkbox): search all (meanings, onyomi, kunyomi) 

        // A. Check for exact match in keywords (combines meaning and reading)
        const allSearchTerms = searchData.split(' ');
        let found = false;

        for (const term of allSearchTerms) {
            // Exact word match
            if (term.toLowerCase() === query) {
                found = true;
                break;
            }
            // Exact reading match (handling hira/kata variations)
            if (wanakana.isJapanese(term) || wanakana.isJapanese(rawQuery)) {
                const termHira = wanakana.toHiragana(term);
                const queryHira = wanakana.toHiragana(rawQuery);
                if (termHira === queryHira) {
                    found = true;
                    break;
                }
            }
        }

        // B. Fallback to check meanings for exact word match using the robust function
        if (!found) {
            found = hasExactWord(meaningsStr, query);
        }

        return found;
    });

    renderListToDOM(filteredList);
}


/** * Clear search input and reset filters 
 */
export function clearSearch() {
    const searchInput = document.getElementById(DOM_IDS.kanjiSearchInput);
    if (!searchInput) return;
    searchInput.value = '';

    // Unbind WanaKana if it was bound 
    try {
        if (window.wanakana) wanakana.unbind(searchInput);
    } catch (e) { /* Ignore */ }

    // Reset checkboxes 
    document.getElementById(DOM_IDS.onyomiCheckbox).checked = false;
    document.getElementById(DOM_IDS.kunyomiCheckbox).checked = false;

    // Reset placeholder 
    searchInput.placeholder = "Type meaning or reading...";

    // Hide jukugo panel
    document.getElementById(DOM_IDS.jukugoPanel).style.display = 'none';
    clearJukugoState(); // <-- Clear Jukugo state

    // Filter to show all 
    renderListToDOM(getMasterKanjiList());
}