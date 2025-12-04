// testing.js - Development/testing configuration

import { DOM_IDS } from './config.js';
import { updateCheckboxMenu, updateDropdownText } from './uiControls.js';

/**
 * Set testing defaults for development
 */
export function setTestingDefaults() {
    console.log('Loading testing configuration...');

    // Set the system dropdown values
    const sourceSystemSelect = document.getElementById(DOM_IDS.sourceSystem);
    const comparisonSystemSelect = document.getElementById(DOM_IDS.comparisonSystem);

    sourceSystemSelect.value = 'kanji_learners_course';
    comparisonSystemSelect.value = 'kanji_kentei_2020';

    // Trigger change events to initialize checkbox menus
    sourceSystemSelect.dispatchEvent(new Event('change'));
    comparisonSystemSelect.dispatchEvent(new Event('change'));

    // select the appropriate checkboxes
    setTimeout(() => {
        // For source (KLC): Select all levels
        selectAllLevels(DOM_IDS.sourceLevelMenu);

        // For comparison (Kanken): Select the default levels
        selectSpecificLevels(DOM_IDS.comparisonLevelMenu, ['kk_10.txt', 'kk_9.txt','kk_9.txt','kk_9.txt', 'kk_8.txt', 'kk_7.txt', 'kk_6.txt', 'kk_5.txt', 'kk_4.txt', 'kk_3.txt', 'kk_pre_2.txt', 'kk_2.txt']);
    }, 50);
}

/**
 * Select all checkboxes in a level menu
 */
function selectAllLevels(menuId) {
    const menu = document.getElementById(menuId);
    const allCheckbox = document.getElementById(`${menuId}-all`);
    const levelCheckboxes = menu.querySelectorAll(`.${menuId}-level`);

    if (allCheckbox && levelCheckboxes.length > 0) {
        levelCheckboxes.forEach(cb => cb.checked = true);
        allCheckbox.checked = true;
        allCheckbox.indeterminate = false;
        updateDropdownText(menuId, menuId.replace('Menu', 'Text'));
    }
}

/**
 * Select specific level files in a menu
 */
function selectSpecificLevels(menuId, fileNames) {
    const menu = document.getElementById(menuId);
    const allCheckbox = document.getElementById(`${menuId}-all`);
    const levelCheckboxes = menu.querySelectorAll(`.${menuId}-level`);

    if (levelCheckboxes.length > 0) {
        levelCheckboxes.forEach(cb => cb.checked = false);
        levelCheckboxes.forEach(cb => {
            if (fileNames.includes(cb.dataset.file)) {
                cb.checked = true;
            }
        });

        const checkedCount = Array.from(levelCheckboxes).filter(cb => cb.checked).length;
        const totalCount = levelCheckboxes.length;

        if (checkedCount === totalCount) {
            allCheckbox.checked = true;
            allCheckbox.indeterminate = false;
        } else if (checkedCount === 0) {
            allCheckbox.checked = false;
            allCheckbox.indeterminate = false;
        } else {
            allCheckbox.checked = false;
            allCheckbox.indeterminate = true;
        }

        updateDropdownText(menuId, menuId.replace('Menu', 'Text'));
    }
}

/**
 * Check if in development mode (for conditional loading)
 */
export function isDevelopmentMode() {
    // You can use various methods:
    // 1. URL parameter: ?dev=true
    // 2. Hostname check
    // 3. LocalStorage flag
    return window.location.hostname === 'localhost' ||
        window.location.search.includes('dev=true') ||
        localStorage.getItem('devMode') === 'true';
}