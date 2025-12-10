// js/kanjiGrid.js - Handles kanji grid rendering

import { DOM_IDS, KANJI_TYPES } from './config.js';
import { buildKanjiSearchKeywords } from './dataProcessor.js';
import { showKanjiInfo, showJukugoWords, hideJukugoPanel } from './kanjiInfo.js';
import { jukugoState } from './state.js';
import { getSystemAbbr } from './dataLoader.js';


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
    showJukugoWords(jukugoState.lastReading, kanji); // 
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


// Function to get the current input method (assuming this is where it's defined/available)
function getCurrentInputMethod() {
    const inputMethodEl = document.getElementById(DOM_IDS.inputMethod);
    return inputMethodEl ? inputMethodEl.value : 'index'; // Default to 'index' if not found
}

export function renderStats(results, sourceTotalKanji) {
  const statsEl = document.getElementById(DOM_IDS.stats);
  const total = results.learned.length + results.unlearned.length;
  const totalStudied = results.learned.length + results.userOnly.length;
  const progress = total > 0 ? Math.round((results.learned.length / total) * 100) : 0;

  const currentInputMethod = getCurrentInputMethod();

  let systemName;
  let systemKey;

  if (currentInputMethod === 'custom') {
    // If 'custom' is selected, hardcode the name
    systemName = 'My List';
    systemKey = 'custom'; // Use a special key for custom mode
  } else {
    // Otherwise (for 'index' or predefined), use the dropdown
    const systemEl = document.getElementById(DOM_IDS.sourceSystem);
    systemName = systemEl ? systemEl.options[systemEl.selectedIndex].text : '';
    systemKey = systemEl ? systemEl.value : '';
  }

  const learnedPercentOfSource = sourceTotalKanji > 0
    ? Math.round((totalStudied / sourceTotalKanji) * 100)
    : 0;

  // Get the currect system name from the comparison system dropdown
  const comparisonSystemEl = document.getElementById(DOM_IDS.comparisonSystem);
  const comparisonSystemName = comparisonSystemEl ? comparisonSystemEl.options[comparisonSystemEl.selectedIndex].text : '';
  const comparisonKey = comparisonSystemEl.value;

  const systemAbbr = getSystemAbbr(systemKey);
  const comparisonAbbr = getSystemAbbr(comparisonKey);


  document.getElementById('statsSection').querySelector('.stats-header').innerHTML =
    // Include the subtle explanation of the grid order
    `<p class="explanation">Kanji order is based on the Source list.</p>`;


  statsEl.innerHTML = `
  
  <div class="stats-panel user-source">
      <h4 class="panel-title"><b>From</b> ${systemName}</h4>
      
      <div class="stat-card coverage">
          <span class="stat-label">I know</span>
          <span class="stat-number">${totalStudied}</span>
          <span class="stat-percent">(${learnedPercentOfSource}%)</span>
      </div>

      <div class="stat-card extra">
          <span class="stat-number">${results.userOnly.length}</span>
          <span class="stat-label">Extra not in ${comparisonAbbr}</span>
      </div>
  </div>

  <div class="stats-panel comparison-target">
  <h4 class="panel-title"><b>Of</b> ${comparisonSystemName}</h4>
  
  <div class="stat-card coverage">
  <span class="stat-label">I know</span> 
      <span class="stat-number">${results.learned.length}</span>
          <span class="stat-percent">(${progress}% Coverage)</span>
      </span>
  </div>

  <div class="stat-card missing">
      <span class="stat-number">${results.unlearned.length}</span>
      <span class="stat-label">Missing Kanji to Learn</span>
  </div>
</div>
`;
}

export function showStatsSection() {
  document.getElementById(DOM_IDS.statsSection).style.display = 'block';
}

export function showSearchSection() {
  document.getElementById(DOM_IDS.searchSection).style.display = 'block';
}


