// eventHandlers.js - Centralized event handler setup

import { DOM_IDS } from './config.js';
import { loadMultipleLists } from './dataLoader.js';
import { getUserKanjiSet, compareKanjiLists } from './dataProcessor.js';
import {
    updateCheckboxMenu,
    toggleDropdown,
    closeAllDropdowns,
    setToggleEnabled,
    switchInputMethod,
    toggleViewMode,
    showLoading,
    showError,
    clearError
} from './uiControls.js';
import { renderKanjiGrid, renderStats, showStatsSection, showSearchSection } from './kanjiGrid.js';
import { showKanjiInfo, hideKanjiInfo, hideJukugoPanel } from './kanjiInfo.js';
import { filterGrid, handleCheckboxChange } from './search.js';

/**
 * Setup all event listeners
 */
export function setupEventListeners() {
    setupInputMethodListeners();
    setupSystemSelectListeners();
    setupDropdownListeners();
    setupVisualizeButtonListener();
    setupKanjiClickListener();
    setupOutsideClickListener();
    setupSearchListeners();
    setupProgressIndexListeners();
}

/**
 * Input method switching
 */
function setupInputMethodListeners() {
    document.getElementById(DOM_IDS.inputMethod).addEventListener('change', (e) => {
        switchInputMethod(e.target.value);
    });
}

/**
 * System selection listeners
 */
function setupSystemSelectListeners() {
    // Initially disable toggles
    setToggleEnabled(DOM_IDS.sourceLevelToggle, false);
    setToggleEnabled(DOM_IDS.comparisonLevelToggle, false);

    // Enable toggle when a system is selected
    document.getElementById(DOM_IDS.sourceSystem).addEventListener('change', (e) => {
        updateCheckboxMenu(e.target.value, DOM_IDS.sourceLevelMenu, DOM_IDS.sourceLevelText);
        setToggleEnabled(DOM_IDS.sourceLevelToggle, true);
    });

    document.getElementById(DOM_IDS.comparisonSystem).addEventListener('change', (e) => {
        updateCheckboxMenu(e.target.value, DOM_IDS.comparisonLevelMenu, DOM_IDS.comparisonLevelText);
        setToggleEnabled(DOM_IDS.comparisonLevelToggle, true);
    });
}

/**
 * Dropdown toggle listeners
 */
function setupDropdownListeners() {
    document.getElementById(DOM_IDS.sourceLevelToggle).addEventListener('click', (e) => {
        toggleDropdown(DOM_IDS.sourceLevelMenu, DOM_IDS.comparisonLevelMenu);
    });

    document.getElementById(DOM_IDS.comparisonLevelToggle).addEventListener('click', (e) => {
        toggleDropdown(DOM_IDS.comparisonLevelMenu, DOM_IDS.sourceLevelMenu);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-checkbox')) {
            closeAllDropdowns();
        }
    });
}

/**
 * Visualize button listener
 */
function setupVisualizeButtonListener() {
    document.getElementById(DOM_IDS.visualizeBtn).addEventListener('click', async () => {
        clearError();

        // Check if switching back to options
        const switchedToOptions = toggleViewMode();
        if (switchedToOptions) {
            return;
        }

        try {
            const comparisonSystem = document.getElementById(DOM_IDS.comparisonSystem).value;
            const comparisonFiles = getSelectedFiles(DOM_IDS.comparisonLevelMenu);

            if (comparisonFiles.length === 0) {
                throw new Error('Please select at least one comparison level!');
            }

            //showLoading();

            const comparisonArray = await loadMultipleLists(comparisonSystem, comparisonFiles);
            const userArray = await getUserKanjiSet();

            const results = compareKanjiLists(userArray, comparisonArray);

            showStatsSection();
            showSearchSection();
            renderStats(results);
            renderKanjiGrid(userArray, comparisonArray);

        } catch (error) {
            showError(error.message);
        }
    });
}

/**
 * Kanji click listener for showing info
 */
function setupKanjiClickListener() {
    document.getElementById(DOM_IDS.kanjiGrid).addEventListener('click', (e) => {
        const div = e.target.closest('.kanji');
        if (!div) return;
        showKanjiInfo(div.textContent);
    });
}

/**
 * Outside click listener for closing panels
 */
function setupOutsideClickListener() {
    document.addEventListener('click', (e) => {
        const panel = document.getElementById(DOM_IDS.kanjiInfoPanel);
        const clickedInsidePanel = panel.contains(e.target);
        const clickedKanji = e.target.closest('.kanji');

        if (!clickedInsidePanel && !clickedKanji) {
            hideKanjiInfo();
            hideJukugoPanel();
        }
    });
}

/**
 * Search input listeners
 */
function setupSearchListeners() {
    const searchInput = document.getElementById(DOM_IDS.kanjiSearchInput);

    // Small timeout to allow WanaKana to finish converting
    searchInput.addEventListener('input', () => {
        setTimeout(filterGrid, 0);
    });

    searchInput.addEventListener('compositionend', () => {
        setTimeout(filterGrid, 0);
    });
}

/**
 * Progress index (number input) increment/decrement listeners
 */
function setupProgressIndexListeners() {
    const progressInput = document.getElementById(DOM_IDS.progressIndex);
    const upButton = document.querySelector('.btn-up');
    const downButton = document.querySelector('.btn-down');

    if (!progressInput || !upButton || !downButton) {
        console.warn('Progress index elements not found');
        return;
    }

    // Up button: increment value
    upButton.addEventListener('click', () => {
        const currentValue = parseInt(progressInput.value) || 0;
        progressInput.value = currentValue + 1;

        // Trigger input event for any dependent functionality
        progressInput.dispatchEvent(new Event('input'));
        progressInput.dispatchEvent(new Event('change'));
    });

    // Down button: decrement value (with min constraint)
    downButton.addEventListener('click', () => {
        const currentValue = parseInt(progressInput.value) || 0;
        const minValue = parseInt(progressInput.min) || 0;

        if (currentValue > minValue) {
            progressInput.value = currentValue - 1;

            // Trigger input event for any dependent functionality
            progressInput.dispatchEvent(new Event('input'));
            progressInput.dispatchEvent(new Event('change'));
        }
    });

    // Optional: Add keyboard shortcuts (up/down arrows)
    progressInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            upButton.click();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            downButton.click();
        }
    });
}

/**
 * Helper function to get selected files (imported from dataProcessor)
 */
function getSelectedFiles(menuId) {
    const menu = document.getElementById(menuId);
    const checked = menu.querySelectorAll(`.${menuId}-level:checked`);
    return Array.from(checked).map(cb => cb.dataset.file);
}

/**
 * Make handleCheckboxChange available globally for HTML onclick handlers
 */
window.handleCheckboxChange = handleCheckboxChange;