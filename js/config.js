// config.js - Centralized configuration and constants

export const DOM_IDS = {
    // Input controls
    inputMethod: 'inputMethod',
    sourceSystem: 'sourceSystem',
    comparisonSystem: 'comparisonSystem',
    progressIndex: 'progressIndex',
    customKanji: 'customKanji',

    // Containers
    indexInput: 'indexInput',
    customInput: 'customInput',
    controlsPanel: 'controlsPanel',
    statsSection: 'statsSection',
    searchSection: 'searchSection',
    errorSection: 'errorSection',

    // Dropdowns
    sourceLevelToggle: 'sourceLevelToggle',
    sourceLevelMenu: 'sourceLevelMenu',
    sourceLevelText: 'sourceLevelText',
    comparisonLevelToggle: 'comparisonLevelToggle',
    comparisonLevelMenu: 'comparisonLevelMenu',
    comparisonLevelText: 'comparisonLevelText',

    // Display areas
    kanjiGrid: 'kanjiGrid',
    stats: 'stats',
    kanjiInfoPanel: 'kanjiInfoPanel',
    kanjiInfoContent: 'kanjiInfoContent',
    jukugoPanel: 'jukugoPanel',
    jukugoPanelContent: 'jukugoPanelContent',

    // Buttons and inputs
    visualizeBtn: 'visualizeBtn',
    kanjiSearchInput: 'kanjiSearchInput',
    onyomiCheckbox: 'onyomi-checkbox',
    kunyomiCheckbox: 'kunyomi-checkbox'
};

export const KANJI_SYSTEMS = {
    kanji_kentei_2020: [
        { file: 'kk_10.txt', label: 'Level 10 (80 kanji)' },
        { file: 'kk_9.txt', label: 'Level 9 (160 kanji)' },
        { file: 'kk_8.txt', label: 'Level 8 (200 kanji)' },
        { file: 'kk_7.txt', label: 'Level 7 (202 kanji)' },
        { file: 'kk_6.txt', label: 'Level 6 (193 kanji)' },
        { file: 'kk_5.txt', label: 'Level 5 (191 kanji)' },
        { file: 'kk_4.txt', label: 'Level 4 (313 kanji)' },
        { file: 'kk_3.txt', label: 'Level 3 (284 kanji)' },
        { file: 'kk_pre_2.txt', label: 'Pre-2 (328 kanji)' },
        { file: 'kk_2.txt', label: 'Level 2 (185 kanji)' },
        { file: 'kk_pre_1.txt', label: 'Pre-1 (891 kanji)' },
        { file: 'kk_1.txt', label: 'Level 1 (3328 kanji)' },
        // { file: 'kk_other.txt', label: 'Other (681 kanji)' }
    ],
    japanese_school_grades: [
        { file: 'japanese_school_grades_elementary_1.txt', label: 'Elementary 1 (80 kanji)' },
        { file: 'japanese_school_grades_elementary_2.txt', label: 'Elementary 2 (160 kanji)' },
        { file: 'japanese_school_grades_elementary_3.txt', label: 'Elementary 3 (200 kanji)' },
        { file: 'japanese_school_grades_elementary_4.txt', label: 'Elementary 4 (200 kanji)' },
        { file: 'japanese_school_grades_elementary_5.txt', label: 'Elementary 5 (185 kanji)' },
        { file: 'japanese_school_grades_elementary_6.txt', label: 'Elementary 6 (181 kanji)' },
        { file: 'japanese_school_grades_secondary_1.txt', label: 'Secondary 1 (316 kanji)' },
        { file: 'japanese_school_grades_secondary_2.txt', label: 'Secondary 2 (285 kanji)' },
        { file: 'japanese_school_grades_secondary_3.txt', label: 'Secondary 3 (333 kanji)' },
        { file: 'japanese_school_grades_advanced.txt', label: 'Advanced (196 kanji)' },
        // { file: 'japanese_school_grades_other.txt', label: 'Other (4900 kanji)' }
    ],
    jlpt_levels: [
        { file: 'jlpt_beginner.txt', label: 'Beginner (80 kanji)' },
        { file: 'jlpt_basic.txt', label: 'Basic (166 kanji)' },
        { file: 'jlpt_intermediate.txt', label: 'Intermediate (370 kanji)' },
        { file: 'jlpt_advanced.txt', label: 'Advanced (370 kanji)' },
        { file: 'jlpt_expert.txt', label: 'Expert (1240 kanji)' },
        // { file: 'jlpt_other.txt', label: 'Other (4810 kanji)' }
    ],
    kanji_learners_course: [
        { file: 'kanji_learners_course_level_1.txt', label: 'Level 1 (100 kanji)' },
        { file: 'kanji_learners_course_level_2.txt', label: 'Level 2 (100 kanji)' },
        { file: 'kanji_learners_course_level_3.txt', label: 'Level 3 (100 kanji)' },
        { file: 'kanji_learners_course_level_4.txt', label: 'Level 4 (100 kanji)' },
        { file: 'kanji_learners_course_level_5.txt', label: 'Level 5 (100 kanji)' },
        { file: 'kanji_learners_course_level_6.txt', label: 'Level 6 (100 kanji)' },
        { file: 'kanji_learners_course_level_7.txt', label: 'Level 7 (100 kanji)' },
        { file: 'kanji_learners_course_level_8.txt', label: 'Level 8 (100 kanji)' },
        { file: 'kanji_learners_course_level_9.txt', label: 'Level 9 (100 kanji)' },
        { file: 'kanji_learners_course_level_10.txt', label: 'Level 10 (100 kanji)' },
        { file: 'kanji_learners_course_level_11.txt', label: 'Level 11 (100 kanji)' },
        { file: 'kanji_learners_course_level_12.txt', label: 'Level 12 (100 kanji)' },
        { file: 'kanji_learners_course_level_13.txt', label: 'Level 13 (100 kanji)' },
        { file: 'kanji_learners_course_level_14.txt', label: 'Level 14 (100 kanji)' },
        { file: 'kanji_learners_course_level_15.txt', label: 'Level 15 (100 kanji)' },
        { file: 'kanji_learners_course_level_16.txt', label: 'Level 16 (100 kanji)' },
        { file: 'kanji_learners_course_level_17.txt', label: 'Level 17 (100 kanji)' },
        { file: 'kanji_learners_course_level_18.txt', label: 'Level 18 (100 kanji)' },
        { file: 'kanji_learners_course_level_19.txt', label: 'Level 19 (100 kanji)' },
        { file: 'kanji_learners_course_level_20.txt', label: 'Level 20 (100 kanji)' },
        { file: 'kanji_learners_course_level_21.txt', label: 'Level 21 (100 kanji)' },
        { file: 'kanji_learners_course_level_22.txt', label: 'Level 22 (100 kanji)' },
        { file: 'kanji_learners_course_level_23.txt', label: 'Level 23 (100 kanji)' },
        // { file: 'kanji_learners_course_other.txt', label: 'Other (4736 kanji)' }
    ]
};

export const KANJI_TYPES = {
    LEARNED: 'learned',
    UNLEARNED: 'unlearned',
    USER_ONLY: 'user-only'
};

export const INPUT_METHODS = {
    INDEX: 'index',
    CUSTOM: 'custom'
};

export const CSS_CLASSES = {
    checkboxItem: 'checkbox-item',
    checkboxItemAll: 'checkbox-item all',
    dropdownShow: 'show',
    loading: 'loading'
};