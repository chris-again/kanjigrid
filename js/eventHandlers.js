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
    clearError,
    setButtonEnabled
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

    // Listener for Custom Kanji Textarea (needs to be checked on input)
    document.getElementById(DOM_IDS.customKanji)?.addEventListener('input', checkCanVisualize);

    //Listener for Level Checkbox changes (needs to be checked when menu state changes)
    document.addEventListener('checkbox_state_change', checkCanVisualize);

    // Initial check to disable the button on load
    checkCanVisualize();
}

/**
 * Input method switching
 */
function setupInputMethodListeners() {
    document.getElementById(DOM_IDS.inputMethod).addEventListener('change', (e) => {
        switchInputMethod(e.target.value);
        checkCanVisualize();
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
        checkCanVisualize();
    });

    document.getElementById(DOM_IDS.comparisonSystem).addEventListener('change', (e) => {
        updateCheckboxMenu(e.target.value, DOM_IDS.comparisonLevelMenu, DOM_IDS.comparisonLevelText);
        setToggleEnabled(DOM_IDS.comparisonLevelToggle, true);
        checkCanVisualize();
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

    // Add listeners to the input field itself
    progressInput.addEventListener('input', checkCanVisualize);
    progressInput.addEventListener('change', checkCanVisualize);

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
 * Checks if all required options are selected/filled to enable the Visualize button.
 */
function checkCanVisualize() {
    const inputMethod = document.getElementById(DOM_IDS.inputMethod)?.value;

    // If the user hasn't selected an input method yet, it should fail validation immediately.
    if (!inputMethod) {
        setButtonEnabled(DOM_IDS.visualizeBtn, false);
        return false;
    }

    // 1. Check Source (Your Kanji) Validity
    let sourceValid = false;

    if (inputMethod === 'custom') {
        // Validation for Custom Input: Check if textarea has text
        const customKanji = document.getElementById(DOM_IDS.customKanji)?.value || '';
        sourceValid = customKanji.trim().length > 0;

        // Add listener for this input if it's the active method
        document.getElementById(DOM_IDS.customKanji)?.addEventListener('input', checkCanVisualize, { once: true });

    } else { // 'index' method
        const sourceSystem = document.getElementById(DOM_IDS.sourceSystem)?.value;
        const sourceLevels = getSelectedFiles(DOM_IDS.sourceLevelMenu);
        const progressIndex = document.getElementById(DOM_IDS.progressIndex)?.value;

        // Valid if: System is selected AND (Levels are selected OR Index is entered)
        sourceValid = !!sourceSystem && (sourceLevels.length > 0 || progressIndex);
    }

    // 2. Check Comparison Target Validity
    const comparisonSystem = document.getElementById(DOM_IDS.comparisonSystem)?.value;
    const comparisonLevels = getSelectedFiles(DOM_IDS.comparisonLevelMenu);

    // Valid if: Comparison System is selected AND Levels are selected
    const comparisonValid = !!comparisonSystem && comparisonLevels.length > 0;

    const allValid = sourceValid && comparisonValid;

    // Enable/disable the button based on the check
    setButtonEnabled(DOM_IDS.visualizeBtn, allValid);
    return allValid;
}

/**
 * Make handleCheckboxChange available globally for HTML onclick handlers
 */
window.handleCheckboxChange = handleCheckboxChange;