// kanjiInfo.js - Handles kanji detail panel

import { DOM_IDS } from './config.js';
import { fetchJukugoDetailsInWorker } from './dataLoader.js';



/**
 * Helper function to manage the visibility of the whole panel wrapper.
 * @param {boolean} show - true to show (add .active), false to hide (remove .active)
 */
function setPanelsContainerVisibility(show) {
  if (!panelsContainer) return;

  if (show) {
    panelsContainer.classList.add('active');
  } else {
    // Only hide the container if *both* kanjiInfoPanel and jukugoPanel are meant to be hidden.
    // Handling inside hideKanjiInfo and hideJukugoPanel.
    // For now, call helper with `true` when showing.
    // The individual hide functions will call .classList.remove('active').
  }
}




/**
 * Show kanji information panel
 */
export function showKanjiInfo(kanji) {
  const panel = document.getElementById(DOM_IDS.kanjiInfoPanel);
  const content = document.getElementById(DOM_IDS.kanjiInfoContent);

  const data = Kanji.getDetails(kanji);

  if (!data) {
    panel.style.display = 'block';
    setPanelsContainerVisibility(true);
    content.innerHTML = `<p>No data available</p>`;
    return;
  }

  panel.style.display = 'block';
  setPanelsContainerVisibility(true);
  content.innerHTML = `
        <h2>${kanji}</h2>
        <div class="kanji-details">
          <div class="kanji-meaning">
            <b>Meaning:</b>
            ${data.meanings?.map(m => `<span class="tag meaning">${m}</span>`).join(' ') || '–'}
          </div>
          <div class="kanji-readings">
            <b>On:</b>
            ${data.onyomi?.map(r => `<span class="tag onyomi">${r}</span>`).join(' ') || '–'}
          </div>
          <div class="kanji-readings">
            <b>Kun:</b>
            ${data.kunyomi?.map(r => `<span class="tag kunyomi">${r}</span>`).join(' ') || '–'}
          </div>
          <div class="kanji-strokes">
            <b>Stroke count:</b> ${data.stroke_count || '–'}
          </div>
        </div>
    `;
}

/**
 * Hide kanji information panel
 */
export function hideKanjiInfo() {
  const kanjiInfoPanel = document.getElementById(DOM_IDS.kanjiInfoPanel);
  const jukugoPanel = document.getElementById(DOM_IDS.jukugoPanel);

  kanjiInfoPanel.style.display = 'none';

  // Check if the other panel (Jukugo) is also hidden. If both are hidden,
  // the main container can be hidden to trigger the slide-down animation.
  if (panelsContainer && jukugoPanel.style.display === 'none') {
    panelsContainer.classList.remove('active');
  }
}

/**
 * Show jukugo (compound words) panel - ASYNCHRONOUS
 * @param {string} reading - The user's input (Romaji/Kana)
 * @param {string} clickedKanji - The specific kanji character clicked in the grid.
 */
export function showJukugoWords(reading, clickedKanji) {
  const jukugoPanel = document.getElementById(DOM_IDS.jukugoPanel);
  const content = document.getElementById(DOM_IDS.jukugoPanelContent);

  if (typeof wanakana === 'undefined' || !reading) {
    jukugoPanel.style.display = 'none';
    return;
  }

  const hiraganaReading = wanakana.toHiragana(reading);

  // 1. Show loading state and panel
  content.innerHTML = `
<div class="text-center py-4 text-sm text-gray-500 animate-pulse">
Searching for Jukugo words matching: ${hiraganaReading}...
</div>
`;
  jukugoPanel.style.display = 'block';
  setPanelsContainerVisibility(true); // Show the parent container

  // 2. Call worker asynchronously to fetch the detailed entries
  fetchJukugoDetailsInWorker(hiraganaReading, (matchingWords) => {

    // --- NEW FILTERING STEP ---
    const filteredWords = matchingWords.filter(entry => {
      if (!entry.kanji || entry.kanji.length === 0) {
        return false;
      }
      return entry.kanji.some(k => k.text.includes(clickedKanji));
    });
    // --- END NEW FILTERING STEP ---


    if (!filteredWords || filteredWords.length === 0) {
      content.innerHTML = `
<div class="text-center py-4 text-sm text-gray-500">
No Jukugo words containing "${clickedKanji}" found for reading "${reading}".
</div>
`;
      return;
    }

    // 3. Build HTML for each word
    let html = '';
    for (const word of filteredWords) {
      const kanjiText = word.kanji && word.kanji.length > 0
        ? word.kanji[0].text
        : hiraganaReading;

      const readingText = word.kana && word.kana.length > 0
        ? word.kana[0].text
        : hiraganaReading;

      const meanings = [];
      if (word.sense && word.sense.length > 0) {
        for (const sense of word.sense) {
          if (sense.gloss && sense.gloss.length > 0) {
            const englishGlosses = sense.gloss.filter(g => g.lang === 'eng').map(g => g.text);
            meanings.push(...englishGlosses);
          }
        }
      }

      const meaningText = meanings.length > 0
        ? meanings.slice(0, 3).join('; ')
        : 'No definition available';

      html += `
<div class="jukugo-word border-b border-gray-200 p-2">
<div class="jukugo-word-kanji text-xl font-bold text-blue-700">${kanjiText}</div>
<div class="jukugo-word-reading text-sm text-gray-600">${readingText}</div>
<div class="jukugo-word-meaning text-xs mt-1">${meaningText}</div>
</div>
`;
    }

    content.innerHTML = html;
    // Panel display is already block, no need to set again here.
  });
}

/**
 * Hide jukugo panel
 */
export function hideJukugoPanel() {
  const kanjiInfoPanel = document.getElementById(DOM_IDS.kanjiInfoPanel);
  const jukugoPanel = document.getElementById(DOM_IDS.jukugoPanel);

  jukugoPanel.style.display = 'none';
  
  // Check if the other panel (Kanji Info) is also hidden. If both are hidden,
  // the main container can be hidden to trigger the slide-down animation.
  if (panelsContainer && kanjiInfoPanel.style.display === 'none') {
      panelsContainer.classList.remove('active');
  }
}