// js/dataLoader.js - Handles all data loading operations

import { KANJI_SYSTEMS } from './config.js';

const JMDICT_CDN_URL = "https://jmdict.b-cdn.net/jmdict-eng-3.6.1.json";

const cache = new Map();
let worker = null;
let jmdictLoaded = false;
let onJukugoResults = null;
let onJukugoDetailsResults = null; // Callback for word details

// Initialize Worker
if (window.Worker) {
    worker = new Worker('js/workers/data.worker.js');

    worker.onmessage = (e) => {
        const { type, results } = e.data;
        if (type === 'JMDICT_LOADED') {
            jmdictLoaded = true;
            console.log('JMDict loaded in Worker');
        } else if (type === 'JUKUGO_RESULTS') {
            if (onJukugoResults) onJukugoResults(results);
        } else if (type === 'JUKUGO_DETAILS_RESULTS') { // Handler for word details
            if (onJukugoDetailsResults) onJukugoDetailsResults(results);
        }
    };
}

// ----------------------------------------------------
// EXPORTS
// ----------------------------------------------------

export function getSystems() {
    return KANJI_SYSTEMS;
}

export function getJMDictData() {
    console.warn("getJMDictData() is obsolete. The JMDict data is now processed in a Web Worker.");
    return null;
}

export async function loadListSingle(systemName, fileName) {
    const cacheKey = `${systemName}/${fileName}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        const response = await fetch(`${systemName}/${fileName}`);
        if (!response.ok) throw new Error(`404: ${fileName}`);
        const text = await response.text();

        // Fast parsing using Set
        const kanjiSet = new Set();
        for (const char of text) {
            if (/\p{Script=Han}/u.test(char)) {
                kanjiSet.add(char);
            }
        }

        const result = Array.from(kanjiSet);
        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.warn(`Failed to load ${fileName}`, error);
        return [];
    }
}

export async function loadMultipleLists(systemName, fileNames) {
    const promises = fileNames.map(f => loadListSingle(systemName, f));
    const results = await Promise.all(promises);

    const combinedSet = new Set();
    results.forEach(list => list.forEach(k => combinedSet.add(k)));

    return Array.from(combinedSet);
}

export function loadJMDict() {
    if (worker) {
        worker.postMessage({
            type: 'LOAD_JMDICT',
            payload: { url: JMDICT_CDN_URL }
        });
    }
}

export function searchJukugoInWorker(query, callback) {
    if (worker && jmdictLoaded) {
        onJukugoResults = callback;
        worker.postMessage({
            type: 'SEARCH_JUKUGO',
            payload: { query }
        });
    } else {
        callback([]);
    }
}

export function fetchJukugoDetailsInWorker(hiraganaQuery, callback) {
    if (worker && jmdictLoaded) {
        onJukugoDetailsResults = callback;
        worker.postMessage({
            type: 'FETCH_JUKUGO_DETAILS',
            payload: { query: hiraganaQuery }
        });
    } else {
        callback([]);
    }
}

export function isJMDictLoaded() {
    return jmdictLoaded;
}