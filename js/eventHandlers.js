// eventHandlers.js - Centralized event handler setup

import { DOM_IDS } from './config.js';
import { loadMultipleLists } from './dataLoader.js';
import { getUserKanjiSet, compareKanjiLists, getSourceKanjiTotal } from './dataProcessor.js';
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
import {
    switchStep,
    updateStepVisibility,
    isStep1Valid,
    isStep2Valid,
    currentStep
} from './stepProgress.js';
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
    setupMobilePanelListeners();
    setupProgressStepListeners();
    setupHeaderClickListener();
    setupStatsToggleListener();

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
    // Initially disable toggles and progress index
    setToggleEnabled(DOM_IDS.sourceLevelToggle, false);
    setToggleEnabled(DOM_IDS.comparisonLevelToggle, false);

    const progressIndexInput = document.getElementById(DOM_IDS.progressIndex);
    const upButton = document.querySelector('.btn-up');
    const downButton = document.querySelector('.btn-down');
    if (progressIndexInput) {
        progressIndexInput.disabled = true;
    }
    if (upButton) {
        upButton.disabled = true;
    }
    if (downButton) {
        downButton.disabled = true;
    }

    // Enable toggle and Progress Index when a system is selected
    document.getElementById(DOM_IDS.sourceSystem).addEventListener('change', (e) => {
        updateCheckboxMenu(e.target.value, DOM_IDS.sourceLevelMenu, DOM_IDS.sourceLevelText);
        setToggleEnabled(DOM_IDS.sourceLevelToggle, true);
        if (progressIndexInput) {
            progressIndexInput.disabled = false;
        }
        if (upButton) {
            upButton.disabled = false;
        }
        if (downButton) {
            downButton.disabled = false;
        }
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
            const sourceTotalKanji = await getSourceKanjiTotal();

            const results = compareKanjiLists(userArray, comparisonArray);

            showStatsSection();
            showSearchSection();
            renderStats(results, sourceTotalKanji);
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
        const panelContainer = document.getElementById('panelsContainer');

        // If we click outside the container AND not on a kanji
        if (panelContainer.classList.contains('active') &&
            !panelContainer.contains(e.target) &&
            !e.target.closest('.kanji')) {

            // Trigger the hide
            hideKanjiInfo();
            hideJukugoPanel();
            panelContainer.classList.remove('active');
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

    // Logic to run when the number changes
    const handleProgressChange = () => {
        const value = progressInput.value;
        const hasValue = value !== "" && parseInt(value) > 0;

        // User types number -> Check all boxes
        // User clears number -> Uncheck all boxes
        const sourceMenu = document.getElementById(DOM_IDS.sourceLevelMenu);
        if (sourceMenu) {
            const checkboxes = sourceMenu.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = hasValue;
            });

            // Visual Update: Update the text label (e.g. "Select levels..." -> "All Selected")
            updateDropdownDisplayText(DOM_IDS.sourceLevelMenu, DOM_IDS.sourceLevelText);
        }

        // Re-validate the visualize button and step progress
        checkCanVisualize();
        updateStepVisibility();
    };

    // listeners to the input field itself
    progressInput.addEventListener('input', handleProgressChange);
    progressInput.addEventListener('change', handleProgressChange);

    // Up button: increment value
    upButton.addEventListener('click', () => {
        const currentValue = parseInt(progressInput.value) || 0;
        progressInput.value = currentValue + 1;

        handleProgressChange();
    });

    // Down button: decrement value (with min constraint)
    downButton.addEventListener('click', () => {
        const currentValue = parseInt(progressInput.value) || 0;
        const minValue = parseInt(progressInput.min) || 0;

        if (currentValue > minValue) {
            progressInput.value = currentValue - 1;
            handleProgressChange();
        } else if (currentValue === 0 || progressInput.value === "") {
            // edge case: if going down to 0 or empty, ensure clearing checkboxes
            progressInput.value = "";
            handleProgressChange();
        }
    });

    // Keyboard shortcuts
    progressInput.addEventListener('keydown', (e) => {
        // Check if the input is disabled before running shortcut logic
        if (progressInput.disabled) {
            e.preventDefault(); // Prevent default behavior (e.g. scrolling)
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            upButton.click();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            downButton.click();
        }
    });
}


function updateDropdownDisplayText(menuId, textId) {
    const menu = document.getElementById(menuId);
    const textSpan = document.getElementById(textId);
    if (!menu || !textSpan) return;

    const progressInput = document.getElementById(DOM_IDS.progressIndex);
    const progressValue = progressInput ? progressInput.value : '';
    const isProgressIndexActive = progressValue !== "" && parseInt(progressValue) > 0;

    const checkboxes = menu.querySelectorAll('input[type="checkbox"]');
    const checked = menu.querySelectorAll('input[type="checkbox"]:checked');

    if (menuId === DOM_IDS.sourceLevelMenu && isProgressIndexActive) {
        const numKanji = parseInt(progressValue);
        textSpan.textContent = `First ${numKanji} kanji selected`;
        // You might want to style this differently to indicate the number input is overriding the levels
        textSpan.style.color = 'var(--gold-accent)'; 
        return; // Stop processing the rest of the dropdown logic
    }

    if (checked.length === 0) {
        textSpan.textContent = "Select levels...";
        textSpan.style.color = ""; // Revert to default
    } else if (checked.length === checkboxes.length) {
        textSpan.textContent = "All Selected";
    } else {
        // Create a comma separated list of the first few
        const labels = Array.from(checked).map(cb => {
            // Try to find the label text next to the checkbox
            return cb.parentElement.textContent.trim();
        });

        if (labels.length <= 2) {
            textSpan.textContent = labels.join(", ");
        } else {
            textSpan.textContent = `${labels.length} levels selected`;
        }
    }
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
        sourceValid = !!sourceSystem && (sourceLevels.length > 0 || (progressIndex && progressIndex.length > 0));
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
 * Universal Panel Handlers (Close btn & Drag)
 */
function setupMobilePanelListeners() {
    const panelsContainer = document.getElementById('panelsContainer');
    const closeBtn = document.getElementById('panelCloseBtn');
    const panelHeader = document.getElementById('panelHeader');

    if (!panelsContainer || !closeBtn || !panelHeader) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const hidePanels = () => {
        panelsContainer.classList.remove('active');
        panelsContainer.style.transform = '';
        setTimeout(() => {
            // 3. Perform internal cleanup (clearing content, resetting internal display: none)
            hideKanjiInfo();
            hideJukugoPanel();
        }, 300); // Wait for the 0.3s transition
    };

    // 1. Close Button Logic
    closeBtn.addEventListener('click', () => {
        hidePanels();
    });


    const handleStart = (y) => {
        startY = y;
        isDragging = true;
        panelsContainer.style.transition = 'none'; // Remove lag for direct 1:1 movement
    };

    const handleMove = (y) => {
        if (!isDragging) return;
        const deltaY = y - startY;
        // Only allow dragging down (positive values)
        if (deltaY > 0) {
            panelsContainer.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleEnd = (y) => {
        if (!isDragging) return;
        isDragging = false;
        panelsContainer.style.transition = 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)';

        const deltaY = y - startY;

        if (deltaY > 100) {
            hidePanels();
        } else {
            panelsContainer.style.transform = 'translateY(0)';
            setTimeout(() => {
                panelsContainer.style.transform = '';
            }, 350);
        }
    };

    // --- Touch Events ---
    panelHeader.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientY));
    panelHeader.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientY));
    panelHeader.addEventListener('touchend', (e) => handleEnd(e.changedTouches[0].clientY));

    // --- Mouse Events (for Desktop Dragging) ---
    panelHeader.addEventListener('mousedown', (e) => handleStart(e.clientY));
    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault(); // prevent selecting text while dragging
            handleMove(e.clientY);
        }
    });
    window.addEventListener('mouseup', (e) => {
        if (isDragging) handleEnd(e.clientY);
    });
}

function setupProgressStepListeners() {
    // Attach switchStep to progress bar clicks
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        stepEl.addEventListener('click', () => {
            switchStep(index);
        });
    });

    // Listener for Input Method (Step 1 -> Step 2 Auto-Advance)
    document.getElementById('inputMethod').addEventListener('change', function () {
        updateStepVisibility();
        if (isStep1Valid()) {
            switchStep(1);
        } else if (currentStep === 1) {
            switchStep(1); // Update visible content if step 1 is active
        }
    });

    // Listener for Source System (Part of Step 2 - Index Mode, triggers Step 3 Auto-Advance)
    document.getElementById('sourceSystem').addEventListener('change', function () {
        updateStepVisibility();
    });

    // Listener for Progress Index (Part of Step 2 - Index Mode, triggers Step 3 Auto-Advance)
    document.getElementById('progressIndex').addEventListener('input', function () {
        updateStepVisibility();
    });

    // Listener for Custom Kanji (Completes Step 2 - Custom Mode, triggers Step 3 Auto-Advance)
    document.getElementById('customKanji').addEventListener('input', function () {
        updateStepVisibility();
    });

    // 1. Listener for Source Levels (Part of Step 2 - Index Mode, triggers Step 3 Auto-Advance)
    document.getElementById('sourceLevelMenu').addEventListener('change', function (event) {
        if (event.target.type === 'checkbox') {
            updateStepVisibility();
        }
    });

    // 2. Listener for Comparison System (Part of Step 3)
    document.getElementById('comparisonSystem').addEventListener('change', function () {
        updateStepVisibility();
    });

    // 3. Listener for Comparison Levels (Completes Step 3)
    document.getElementById('comparisonLevelMenu').addEventListener('change', function (event) {
        if (event.target.type === 'checkbox') {
            updateStepVisibility();
        }
    });

    // Initial Setup Calls:
    updateStepVisibility();
    switchStep(0);
}

/**
 * Setup stats panel collapse/expand toggle
 */
function setupStatsToggleListener() {
    const stats = document.getElementById('stats');
    
    if (stats) {
        // Start collapsed - hide panels immediately
        stats.classList.add('collapsed');
        const panels = stats.querySelectorAll('.stats-panel');
        panels.forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Toggle on click of the ::before element area
        stats.addEventListener('click', function(e) {
            // Only toggle if clicking near the top (::before area) or if already collapsed
            const rect = stats.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            
            // If collapsed, allow click anywhere; if expanded, only top 25px
            if (stats.classList.contains('collapsed') || clickY < 25) {
                stats.classList.toggle('collapsed');
                
                // Toggle visibility of stats-panel elements
                const panels = stats.querySelectorAll('.stats-panel');
                const isCollapsed = stats.classList.contains('collapsed');
                
                panels.forEach(panel => {
                    panel.style.display = isCollapsed ? 'none' : 'flex';
                });
            }
        });
    }
}


/**
 * Setup listener for the header to toggle fullscreen/wallpaper mode.
 */
function setupHeaderClickListener() {
    const headerH1 = document.querySelector('header h1');
    const container = document.querySelector('.container');

    // A simple check: assume the grid is "visible" if the controlsPanel is hidden (view mode toggle)
    const isGridVisible = () => {
        // You'll need to confirm the DOM_IDS import for this to work correctly
        // Assuming DOM_IDS.controlsPanel is the ID for the controls div
        const controlsPanel = document.getElementById('controlsPanel');
        const kanjiGrid = document.getElementById('kanjiGrid');

        // Grid is visible if controls are hidden AND the grid has content
        return controlsPanel && controlsPanel.style.display === 'none' && kanjiGrid.children.length > 0;
    };

    headerH1.addEventListener('click', () => {
        // Only allow toggling if a grid has actually been rendered
        if (!isGridVisible()) {
            return;
        }

        document.body.classList.toggle('fullscreen-body');

        // Toggle the fullscreen class on the main container
        container.classList.toggle('fullscreen-mode');

        // We will rely on CSS to handle the visibility changes
    });
}

/**
 * Make handleCheckboxChange available globally for HTML onclick handlers
 */
window.handleCheckboxChange = handleCheckboxChange;