// js/workers/data.worker.js

importScripts('https://unpkg.com/wanakana');

let jmdictIndex = null;
let jmdictWords = []; // Store the full list of words

self.onmessage = async function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'LOAD_JMDICT':
            await loadJMDict(payload.url);
            break;

        case 'SEARCH_JUKUGO':
            // Used by search.js to get the list of matching kanji characters
            searchJukugo(payload.query);
            break;

        case 'FETCH_JUKUGO_DETAILS': // Used by kanjiInfo.js to get the word data
            searchJukugoDetails(payload.query);
            break;
    }
};

async function loadJMDict(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JMDict: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        jmdictWords = data.words || []; // Store the data

        // Build Index: Reading (Hiragana) -> Set of Kanji CHARACTERS found in the word.
        jmdictIndex = new Map();

        for (const entry of jmdictWords) {
            const readings = entry.kana || [];
            const kanjiArr = entry.kanji || [];

            // 1. Collect all unique kanji characters
            const entryKanji = new Set();
            for (const k of kanjiArr) {
                for (const char of (k.text || '')) {
                    if (/\p{Script=Han}/u.test(char)) {
                        entryKanji.add(char);
                    }
                }
            }

            if (entryKanji.size === 0) continue;

            // 2. Map readings to these kanji
            for (const r of readings) {
                const reading = r.text;
                if (!reading) continue;

                const hiraReading = wanakana.toHiragana(reading);

                if (!jmdictIndex.has(hiraReading)) {
                    jmdictIndex.set(hiraReading, new Set());
                }
                const set = jmdictIndex.get(hiraReading);

                for (const k of entryKanji) set.add(k);
            }
        }

        self.postMessage({ type: 'JMDICT_LOADED', success: true });
    } catch (error) {
        self.postMessage({ type: 'ERROR', message: `FATAL Error during JMDict loading from ${url}: ${error.message}` });
    }
}

function searchJukugo(hiraganaQuery) {
    // Returns the list of kanji characters (used for grid filtering)
    if (!jmdictIndex || !jmdictIndex.has(hiraganaQuery)) {
        self.postMessage({ type: 'JUKUGO_RESULTS', results: [] });
        return;
    }

    const results = Array.from(jmdictIndex.get(hiraganaQuery));
    self.postMessage({ type: 'JUKUGO_RESULTS', results });
}

function searchJukugoDetails(hiraganaQuery) {
    // Returns the full dictionary entry (used for panel rendering)
    const matches = [];

    // Check if ANY of the readings in the entry match the query
    for (const entry of jmdictWords) {
        if (!entry.kana) continue;

        // Check if any kana reading matches the required hiragana query
        const isMatch = entry.kana.some(k => wanakana.toHiragana(k.text) === hiraganaQuery);

        if (isMatch) {
            matches.push(entry);
        }
    }

    self.postMessage({ type: 'JUKUGO_DETAILS_RESULTS', results: matches });
}