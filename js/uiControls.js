// js/uiControls.js - Handles UI control interactions

import { DOM_IDS, CSS_CLASSES, INPUT_METHODS } from './config.js';
import { getSystems } from './dataLoader.js';

/**
 * Sets up initial system dropdowns and attaches listeners for system changes.
 */
export function initializeSystemControls() {
    const systems = getSystems();
    const systemNames = Object.keys(systems);

    const sourceSystemEl = document.getElementById(DOM_IDS.sourceSystem);
    const comparisonSystemEl = document.getElementById(DOM_IDS.comparisonSystem);

    if (!sourceSystemEl || !comparisonSystemEl || systemNames.length === 0) return;

    // 1. Populate System Dropdowns
    const optionsHtml =
        `<option value="" disabled selected>Select system...</option>` +
        systemNames.map(name =>
            `<option value="${name}">${name.replace(/_/g, ' ')}</option>`
        ).join('');


    sourceSystemEl.innerHTML = optionsHtml;
    comparisonSystemEl.innerHTML = optionsHtml;

    // 2. Attach Change Listeners to handle dynamic level menu updates

    // Source System Listener
    sourceSystemEl.addEventListener('change', (e) => {
        updateCheckboxMenu(
            e.target.value,
            DOM_IDS.sourceLevelMenu,
            DOM_IDS.sourceLevelText
        );
    });

    // Comparison System Listener
    comparisonSystemEl.addEventListener('change', (e) => {
        updateCheckboxMenu(
            e.target.value,
            DOM_IDS.comparisonLevelMenu,
            DOM_IDS.comparisonLevelText
        );
    });

    // 3. Initialize the level menus with the currently selected systems
    updateCheckboxMenu(
        sourceSystemEl.value,
        DOM_IDS.sourceLevelMenu,
        DOM_IDS.sourceLevelText
    );
    updateCheckboxMenu(
        comparisonSystemEl.value,
        DOM_IDS.comparisonLevelMenu,
        DOM_IDS.comparisonLevelText
    );
}

/**
 * Update checkbox menu for level selection
 */
export function updateCheckboxMenu(systemName, menuId, textId) {
    const menu = document.getElementById(menuId);
    const systems = getSystems();

    // Ignore placeholder system selections
    if (!menu || !systemName || !systems[systemName]) {
        return;
    }

    menu.innerHTML = '';

    // Select All checkbox
    const allItem = document.createElement('label');
    allItem.className = CSS_CLASSES.checkboxItemAll;
    allItem.innerHTML = `
        <input type="checkbox" id="${menuId}-all" data-menu="${menuId}">
        Select All
    `;
    menu.appendChild(allItem);

    // Individual level checkboxes
    systems[systemName].forEach((level, index) => {
        const item = document.createElement('label');
        item.className = CSS_CLASSES.checkboxItem;
        item.innerHTML = `
            <input type="checkbox" class="${menuId}-level" data-file="${level.file}" data-menu="${menuId}">
            ${level.label}
        `;
        menu.appendChild(item);
    });

    const allCheckbox = document.getElementById(`${menuId}-all`);
    const levelCheckboxes = menu.querySelectorAll(`.${menuId}-level`);

    // "Select All" functionality
    allCheckbox.addEventListener('change', (e) => {
        levelCheckboxes.forEach(cb => cb.checked = e.target.checked);
        updateDropdownText(menuId, textId);
    });

    // Individual checkbox changes
    levelCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(levelCheckboxes).every(c => c.checked);
            const noneChecked = Array.from(levelCheckboxes).every(c => !c.checked);
            allCheckbox.checked = allChecked;
            // The indeterminate property is part of HTMLInputElement, but setting it via JS works fine
            allCheckbox.indeterminate = !allChecked && !noneChecked;
            updateDropdownText(menuId, textId);
        });
    });

    updateDropdownText(menuId, textId);
}

/**
 * Update dropdown button text based on selection
 */
export function updateDropdownText(menuId, textId) {
    const menu = document.getElementById(menuId);
    const textEl = document.getElementById(textId);
    const checked = menu.querySelectorAll(`.${menuId}-level:checked`);
    const total = menu.querySelectorAll(`.${menuId}-level`).length;

    if (checked.length === 0) {
        textEl.textContent = 'Select levels...';
    } else if (checked.length === total) {
        // Find the system name based on the menuId to provide context in the text
        const isSource = menuId === DOM_IDS.sourceLevelMenu;
        const systemEl = document.getElementById(isSource ? DOM_IDS.sourceSystem : DOM_IDS.comparisonSystem);
        const systemName = systemEl ? systemEl.options[systemEl.selectedIndex].text : '';

        textEl.textContent = `(All ${total} levels)`;
    } else {
        textEl.textContent = `${checked.length} level${checked.length > 1 ? 's' : ''} selected`;
    }
}

/**
 * Toggle dropdown menu visibility
 */
export function toggleDropdown(menuId, otherMenuId) {
    const menu = document.getElementById(menuId);
    const otherMenu = document.getElementById(otherMenuId);

    menu.classList.toggle(CSS_CLASSES.dropdownShow);
    otherMenu?.classList.remove(CSS_CLASSES.dropdownShow); // Use optional chaining
}

/**
 * Close all dropdown menus
 */
export function closeAllDropdowns() {
    // This is better handled by a global document click listener in eventHandlers.js
    document.getElementById(DOM_IDS.sourceLevelMenu)?.classList.remove(CSS_CLASSES.dropdownShow);
    document.getElementById(DOM_IDS.comparisonLevelMenu)?.classList.remove(CSS_CLASSES.dropdownShow);
}

/**
 * Enable/disable a toggle button
 */
export function setToggleEnabled(toggleId, enabled) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;
    toggle.style.pointerEvents = enabled ? 'auto' : 'none';
    toggle.style.opacity = enabled ? 1 : 0.6;
}

/**
 * Switch between input methods (index/custom)
 */
export function switchInputMethod(method) {
    const indexInput = document.getElementById(DOM_IDS.indexInput);
    const customInput = document.getElementById(DOM_IDS.customInput);
    if (!indexInput || !customInput) return;

    if (method === INPUT_METHODS.CUSTOM) {
        indexInput.style.display = 'none';
        customInput.style.display = 'block';
    } else {
        indexInput.style.display = 'block';
        customInput.style.display = 'none';
    }
}

/**
 * Toggle between grid view and options panel
 */
export function toggleViewMode() {
    const controls = document.getElementById(DOM_IDS.controlsPanel);
    const searchSection = document.getElementById(DOM_IDS.searchSection);
    const btn = document.getElementById(DOM_IDS.visualizeBtn);
    if (!controls || !searchSection || !btn) return false;

    const controlsHidden = controls.style.display === 'none';

    if (controlsHidden) {
        // Switch back to Options
        controls.style.display = 'block';
        searchSection.style.display = 'none';
        btn.textContent = 'SHOW GRID - グリッドを表示';
        return true; // Indicates switch to options
    } else {
        // Switch to Grid View
        controls.style.display = 'none';
        btn.textContent = 'REGENERATE';
        return false; // Indicates switch to grid
    }
}

/**
 * Show loading indicator in grid
 */
export function showLoading() {
    const grid = document.getElementById(DOM_IDS.kanjiGrid);
    if (grid) {
        // Use the CSS class for styling the spinner/message
        grid.innerHTML = `<div class="${CSS_CLASSES.loading}">⏳ Loading data...</div>`;
    }
}

/**
 * Show error message
 */
export function showError(message) {
    const errorSection = document.getElementById(DOM_IDS.errorSection);
    if (errorSection) {
        errorSection.innerHTML = `<div class="error">${message}</div>`;
        errorSection.style.display = 'block';
    }
}

/**
 * Clear error message
 */
export function clearError() {
    const errorSection = document.getElementById(DOM_IDS.errorSection);
    if (errorSection) {
        errorSection.innerHTML = '';
        errorSection.style.display = 'none';
    }
}