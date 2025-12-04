// js/kanjiGrid.js - Handles kanji grid rendering

import { DOM_IDS, KANJI_TYPES } from './config.js';
import { buildKanjiSearchKeywords } from './dataProcessor.js';
import { showKanjiInfo, showJukugoWords, hideJukugoPanel } from './kanjiInfo.js';
import { jukugoState } from './state.js';


// State to hold the full data in memory
let masterKanjiList = [];

/**
 * Handle click on a kanji cell
 */
function handleKanjiClick(event) {
  const kanji = event.target.textContent;

  // 1. Always show the basic Kanji Info Panel for ANY clicked kanji
  showKanjiInfo(kanji);

  // 2. JUKUGO LOGIC: Check if this kanji was highlighted by the last Jukugo search
  if (jukugoState.lastReading && jukugoState.matchingKanji.has(kanji)) {
    // If it was, show the Jukugo panel for that reading, and PASS THE CLICKED KANJI
    showJukugoWords(jukugoState.lastReading, kanji); // <-- CHANGE HERE
  } else {
    // Otherwise, hide the Jukugo panel
    hideJukugoPanel();
  }
}


/**
 * Pre-processes data and starts the render
 */
export function renderKanjiGrid(userArray, comparisonArray) {
  const userSet = new Set(userArray);
  const comparisonSet = new Set(comparisonArray);
  const seen = new Set();

  masterKanjiList = [];

  // 1. Build the Master Data List
  userArray.forEach(k => {
    const type = comparisonSet.has(k) ? KANJI_TYPES.LEARNED : KANJI_TYPES.USER_ONLY;
    // Pre-calculate keywords NOW so we don't do it during search
    masterKanjiList.push({
      kanji: k,
      type,
      keywords: buildKanjiSearchKeywords(k).toLowerCase()
    });
    seen.add(k);
  });

  comparisonArray.forEach(k => {
    if (!seen.has(k)) {
      masterKanjiList.push({
        kanji: k,
        type: KANJI_TYPES.UNLEARNED,
        keywords: buildKanjiSearchKeywords(k).toLowerCase()
      });
      seen.add(k);
    }
  });

  // 2. Render the full list
  renderListToDOM(masterKanjiList);
}

/**
 * Renders a specific list of items to the DOM using Chunking
 * This prevents the UI from freezing when showing 5000+ items
 */
export function renderListToDOM(itemsToRender) {
  const gridEl = document.getElementById(DOM_IDS.kanjiGrid);
  gridEl.innerHTML = ''; // Clear current

  const CHUNK_SIZE = 200;
  let index = 0;

  function renderChunk() {
    const fragment = document.createDocumentFragment();
    const limit = Math.min(index + CHUNK_SIZE, itemsToRender.length);

    for (; index < limit; index++) {
      const item = itemsToRender[index];
      const div = document.createElement('div');

      // Optimization: avoiding huge datasets in DOM attributes
      div.className = `kanji ${item.type}`;
      div.textContent = item.kanji;
      div.title = `${item.kanji}`; // Simple tooltip

      // ATTACH THE CLICK HANDLER HERE
      div.addEventListener('click', handleKanjiClick);

      fragment.appendChild(div);
    }

    gridEl.appendChild(fragment);

    if (index < itemsToRender.length) {
      // Schedule next chunk for next animation frame
      requestAnimationFrame(renderChunk);
    }
  }

  // Start rendering
  renderChunk();
}

export function getMasterKanjiList() {
  return masterKanjiList;
}

export function renderStats(results) {
  const statsEl = document.getElementById(DOM_IDS.stats);
  const total = results.learned.length + results.unlearned.length;
  const progress = total > 0 ? Math.round((results.learned.length / total) * 100) : 0;

  // Get the current system name from the source system dropdown
  const systemEl = document.getElementById(DOM_IDS.sourceSystem);
  const systemName = systemEl ? systemEl.options[systemEl.selectedIndex].text : '';

  // Get the currect system name from the comparison system dropdown
  const comparisonSystemEl = document.getElementById(DOM_IDS.comparisonSystem);
  const comparisonSystemName = comparisonSystemEl ? comparisonSystemEl.options[comparisonSystemEl.selectedIndex].text : '';

  statsEl.innerHTML = `
        <div class="stat-card coverage">
          <span class="stat-number">${results.learned.length}</span>
          <span class="stat-label">You know ${progress}% of <b>${comparisonSystemName}</b> selected levels</span>
        </div>
        <div class="stat-card missing">
          <span class="stat-number">${results.unlearned.length}</span>
          <span class="stat-label">Remaining from <b>${comparisonSystemName}</b> selected levels</span>
        </div>
        <div class="stat-card extra">
        <span class="stat-number">${results.userOnly.length}</span>
        <span class="stat-label">kanji you KNOW outside <b>${comparisonSystemName}</b> selected levels</span>
        </div>`;
}

export function showStatsSection() {
  document.getElementById(DOM_IDS.statsSection).style.display = 'block';
}

export function showSearchSection() {
  document.getElementById(DOM_IDS.searchSection).style.display = 'block';
}


