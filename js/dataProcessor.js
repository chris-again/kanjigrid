// js/dataProcessor.js - Handles data processing and comparison logic

import { DOM_IDS, INPUT_METHODS } from './config.js';
import { loadMultipleLists } from './dataLoader.js';

/**
 * Get the user's kanji set based on selected input method
 */
export async function getUserKanjiSet() {
    const methodEl = document.getElementById(DOM_IDS.inputMethod);
    const method = methodEl ? methodEl.value : INPUT_METHODS.INDEX;

    if (method === INPUT_METHODS.CUSTOM) {
        const customText = document.getElementById(DOM_IDS.customKanji).value;
        if (!customText.trim()) {
            throw new Error('Please enter your learned kanji');
        }

        // OPTIMIZATION: 
        // 1. Not using split('') on large strings.
        // 2. Filtering strictly for Han character
        // 3. Using Set immediately to deduplicate.
        const uniqueKanji = new Set();
        for (const char of customText) {
            // Accept any Han character (includes 〇, 々, radicals, etc.)
            if (/\p{Script=Han}/u.test(char)) {
                uniqueKanji.add(char);
            }
        }

        if (uniqueKanji.size === 0) {
            throw new Error('No valid Kanji found in input.');
        }

        return Array.from(uniqueKanji);
    } else {
        const systemName = document.getElementById(DOM_IDS.sourceSystem).value;
        const selectedFiles = getSelectedFiles(DOM_IDS.sourceLevelMenu);
        const progressIndexInput = document.getElementById(DOM_IDS.progressIndex).value.trim();
        const progressIndex = progressIndexInput ? parseInt(progressIndexInput) : null;

        if (selectedFiles.length === 0) {
            throw new Error('Please select at least one level');
        }

        // calls Parallel Loader
        const sourceArray = await loadMultipleLists(systemName, selectedFiles);

        if (!progressIndex || progressIndex < 0) {
            return sourceArray; // No need to slice if full list
        }

        return sourceArray.slice(0, Math.min(progressIndex, sourceArray.length));
    }
}

/**
 * Compare two kanji lists and categorize them - O(N)
 */
export function compareKanjiLists(userArray, comparisonArray) {
    // Convert to Sets for O(1) lookups
    const userSet = new Set(userArray);
    const comparisonSet = new Set(comparisonArray);

    const learned = [];
    const unlearned = [];
    const userOnly = [];

    // 1. Find Learned vs User-Only
    for (const kanji of userSet) {
        if (comparisonSet.has(kanji)) {
            learned.push(kanji);
        } else {
            userOnly.push(kanji);
        }
    }

    // 2. Find Unlearned
    for (const kanji of comparisonSet) {
        if (!userSet.has(kanji)) {
            unlearned.push(kanji);
        }
    }

    return { learned, unlearned, userOnly };
}

/**
 * Get selected files from a checkbox menu
 */
export function getSelectedFiles(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return [];

    // Select specific checked boxes for this menu
    const checked = menu.querySelectorAll(`input[type="checkbox"]:checked`);
    return Array.from(checked).map(cb => cb.dataset.file).filter(Boolean);
}

/**
 * Build search keywords for a kanji character
 * Used by kanjiGrid.js during Master List creation
 */
export function buildKanjiSearchKeywords(kanji) {
    // Default to just the character
    if (typeof Kanji === 'undefined' || !Kanji.getDetails) {
        return kanji;
    }

    const data = Kanji.getDetails(kanji);
    if (!data) return kanji;

    // Fast concatenation
    // lowercase here to ensure the index is case-insensitive
    const meanings = (data.meanings || []).join(' ').toLowerCase();
    const on = (data.onyomi || []).join(' ').toLowerCase();
    const kun = (data.kunyomi || []).join(' ').toLowerCase();

    return `${kanji} ${meanings} ${on} ${kun}`;
}