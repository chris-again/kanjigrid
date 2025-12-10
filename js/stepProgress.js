// js/stepProgress.js
import { DOM_IDS } from './config.js';
import { showOptionsView } from './uiControls.js'; // Import the function to show the options panel

// --- Helpers ---

export function hasSelectedValue(id) {
    const element = document.getElementById(id);
    return element && element.value !== "" && element.value !== "SELECT SEQUENCE...";
}

export function hasCheckedLevels(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return false;
    return menu.querySelector('input[type="checkbox"]:checked') !== null;
}

export function updateStepDescriptionText(stepIndex, isComplete) {
    const steps = document.querySelectorAll('.progress-step');
    if (!steps[stepIndex]) return;

    const descriptionEl = steps[stepIndex].querySelector('.step-description');
    let baseText;
    let detailText = '';
    let detailClass = '';
    const inputMethod = document.getElementById('inputMethod')?.value;
    // Determine base text and dynamic detail
    if (stepIndex === 0) {
        // STEP 1: Input Method / Source List
        if (inputMethod === 'custom') {
            baseText = "Input";
            detailText = "Custom";
            detailClass = 'input-detail';
        } else if (inputMethod === 'index') {
            baseText = "Input";
            detailText = "Predefined";
            detailClass = 'input-detail';
        } else {
            baseText = "Input";
        }
    } else if (stepIndex === 1) {
        // STEP 2: Progress Index (Stays constant)
        if (inputMethod === 'index') {
            baseText = "Source";
            detailText = getSelectedSystemName(DOM_IDS.sourceSystem);
            detailClass = 'source-detail';
        } else {
            baseText = "Source";
            detailText = "My List";
            detailClass = 'source-detail';
        }
    } else if (stepIndex === 2) {
        // STEP 3: Comparison List
        baseText = "Compare With";
        detailText = getSelectedSystemName(DOM_IDS.comparisonSystem);
        detailClass = 'comparison-detail';
    } else {
        return;
    }

    // Construct the final text: Base Text + Detail Text (System Name)
    let finalText = isComplete ? (baseText + ' ✓') : baseText;

    // Append the system name if available
    if (detailText) {
        // Use a <br> for better layout inside the small progress step circle
        finalText += `<br><span class="system-detail ${detailClass}">${detailText}</span>`;
    }

    descriptionEl.innerHTML = finalText; // Use innerHTML to render the <br> and <span>
}

// --- Validation Functions ---

export function isStep1Valid() {
    return hasSelectedValue('inputMethod');
}

export function isStep2Valid() {
    const inputMethod = document.getElementById('inputMethod')?.value;

    if (inputMethod === 'index') {
        const hasSystem = hasSelectedValue('sourceSystem');
        const hasLevels = hasCheckedLevels('sourceLevelMenu');
        const hasProgressIndex = document.getElementById('progressIndex')?.value.trim() !== '';
        return hasSystem && (hasLevels || hasProgressIndex);

    } else if (inputMethod === 'custom') {
        return document.getElementById('customKanji')?.value.trim().length > 0;
    }
    return false;
}

export function isStep3Valid() {
    return hasSelectedValue('comparisonSystem') && hasCheckedLevels('comparisonLevelMenu');
}

// --- Step Switching and Status Update ---

export let currentStep = 0; // Exported so eventHandlers can check the step

export function switchStep(stepIndex) {
    let targetStep = stepIndex;

    // 1 & 2. Validation Enforcement

    // Check if we are attempting to move FORWARD and failing validation.
    if (targetStep > currentStep) {
        if (currentStep === 0 && !isStep1Valid()) return;
        if (currentStep === 1 && !isStep2Valid()) return;
    }

    // Set the new step
    currentStep = targetStep;

    // Ensure options panel is visible when switching steps
    showOptionsView();

    // 4. Update Step UI (Active state and Progress Fill)
    const steps = document.querySelectorAll('.progress-step');

    steps.forEach((step, i) => {
        step.classList.toggle('active', i === currentStep);
    });

    const progress = ((currentStep + 1) / 3) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // 3. Update Step Content Visibility
    const inputMethod = document.getElementById('inputMethod')?.value;
    document.getElementById('step0')?.classList.toggle('active', currentStep === 0);

    if (currentStep === 1) {
        document.getElementById('step1')?.classList.toggle('active', inputMethod === 'index');
        document.getElementById('step1-custom')?.classList.toggle('active', inputMethod === 'custom');
    } else {
        document.getElementById('step1')?.classList.remove('active');
        document.getElementById('step1-custom')?.classList.remove('active');
    }

    document.getElementById('step2')?.classList.toggle('active', currentStep === 2);

    // 4. Update overall step status 
    updateStepVisibility();
}

/**
 * Helper to get the display name of the selected system.
 */
function getSelectedSystemName(systemId) {
    const systemEl = document.getElementById(systemId);
    if (systemEl && systemEl.options[systemEl.selectedIndex]) {
        // Return the display text of the selected option
        const selectedOption = systemEl.options[systemEl.selectedIndex];
        if (selectedOption.value === "") return ""; // Handle placeholder selection
        return selectedOption.text;
    }
    return "";
}


export function updateStepVisibility() {
    const steps = document.querySelectorAll('.progress-step');
    const valid1 = isStep1Valid();
    const valid2 = isStep2Valid();
    const valid3 = isStep3Valid();

    // Update the text content of the description for steps 
    updateStepDescriptionText(0, valid1);
    updateStepDescriptionText(1, valid2);
    updateStepDescriptionText(2, valid3);

    // Mark steps as COMPLETE
    steps[0]?.classList.toggle('complete', valid1);
    steps[1]?.classList.toggle('complete', valid2);
    steps[2]?.classList.toggle('complete', valid3);

    // Disable next steps if the previous one is not complete
    steps[1]?.classList.toggle('disabled', !valid1);
    steps[2]?.classList.toggle('disabled', !valid2);

    // Logic to prevent staying on a step that just became invalid:
    if (currentStep === 2 && !valid2) {
        switchStep(1);
    } else if (currentStep === 1 && !valid1) {
        switchStep(0);
    }

    // Also, enable/disable the main button
    document.getElementById('visualizeBtn').disabled = !valid2;
}