// main.js - Application entry point
import { loadJMDict } from './dataLoader.js';
import { setupEventListeners } from './eventHandlers.js';
import { initializeSystemControls } from './uiControls.js';

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Kanji Grid application...');

    try {
        // 1. Setup all event listeners (needs to be first for the UI to be interactive)
        setupEventListeners();

        // 2. Initialize the Source/Comparison System dropdowns and associated level menus
        initializeSystemControls();

        // Only run testing defaults on your testing URL
        if (window.location.href.includes('127.0.0.1:1111')) {
            const { setTestingDefaults } = await import('./testing.js');
            //setTestingDefaults();
        }

        // 3. Load JMDict dictionary in the background using the Web Worker for performance
        loadJMDict();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}