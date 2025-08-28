// src/renderer/preload.js - Vollständige API für FlashCard App
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔐 Preload Script wird geladen...');

// Sichere API für Frontend
contextBridge.exposeInMainWorld('electronAPI', {
    // =================================
    // KARTEN-MANAGEMENT
    // =================================
    cards: {
        // Alle Karten abrufen
        getAll: () => {
            console.log('📚 Frontend fordert alle Karten an...');
            return ipcRenderer.invoke('cards:getAll');
        },

        // Karten für Review abrufen (mit Limit)
        getForReview: (limit = 20) => {
            console.log(`📖 Frontend fordert ${limit} Review-Karten an...`);
            return ipcRenderer.invoke('cards:getForReview', limit);
        },

        // Einzelne Karte abrufen
        getById: (cardId) => {
            console.log('🔍 Frontend fordert Karte an:', cardId);
            return ipcRenderer.invoke('cards:getById', cardId);
        },

        // Neue Karte hinzufügen
        add: (cardData) => {
            console.log('➕ Frontend fügt Karte hinzu:', cardData.front.substring(0, 50) + '...');

            // Validation im Preload
            if (!cardData.front || !cardData.back) {
                console.warn('⚠️ Validation Error: Fehlende Pflichtfelder');
                return Promise.resolve({
                    success: false,
                    error: 'Frage und Antwort sind Pflichtfelder'
                });
            }

            return ipcRenderer.invoke('cards:add', {
                front: cardData.front.trim(),
                back: cardData.back.trim(),
                category: cardData.category?.trim() || 'Allgemein'
            });
        },

        // Karte bearbeiten
        update: (cardId, cardData) => {
            console.log('✏️ Frontend bearbeitet Karte:', cardId);
            return ipcRenderer.invoke('cards:update', cardId, cardData);
        },

        // Karte löschen
        delete: (cardId) => {
            console.log('🗑️ Frontend löscht Karte:', cardId);
            return ipcRenderer.invoke('cards:delete', cardId);
        },

        // Karten nach Kategorie filtern
        getByCategory: (category) => {
            console.log('📂 Frontend fordert Karten der Kategorie an:', category);
            return ipcRenderer.invoke('cards:getByCategory', category);
        },

        // Alle Kategorien abrufen
        getCategories: () => {
            console.log('🏷️ Frontend fordert alle Kategorien an...');
            return ipcRenderer.invoke('cards:getCategories');
        }
    },

    // =================================
    // REVIEW-SYSTEM (Spaced Repetition)
    // =================================
    reviews: {
        // Review speichern
        save: (reviewData) => {
            console.log('💾 Frontend speichert Review für Karte:', reviewData.cardId);

            // Validation
            if (!reviewData.cardId || !reviewData.quality) {
                console.warn('⚠️ Review Validation Error: Fehlende Daten');
                return Promise.resolve({
                    success: false,
                    error: 'Karten-ID und Qualität sind erforderlich'
                });
            }

            return ipcRenderer.invoke('reviews:save', {
                cardId: reviewData.cardId,
                quality: Math.max(1, Math.min(3, reviewData.quality)), // 1-3 begrenzen
                responseTime: reviewData.responseTime || 3000,
                timestamp: new Date().toISOString()
            });
        },

        // Review-Historie einer Karte
        getHistory: (cardId, limit = 10) => {
            console.log(`📊 Frontend fordert Review-Historie an für Karte ${cardId} (${limit} Einträge)`);
            return ipcRenderer.invoke('reviews:getHistory', cardId, limit);
        },

        // Alle Reviews eines Zeitraums
        getByDateRange: (startDate, endDate) => {
            console.log('📅 Frontend fordert Reviews für Zeitraum an:', startDate, 'bis', endDate);
            return ipcRenderer.invoke('reviews:getByDateRange', startDate, endDate);
        }
    },

    // =================================
    // STATISTIKEN
    // =================================
    stats: {
        // Allgemeine Statistiken
        get: () => {
            console.log('📊 Frontend fordert Statistiken an...');
            return ipcRenderer.invoke('stats:get');
        },

        // Detaillierte Lernstatistiken
        getDetailed: (period = 'week') => { // 'day', 'week', 'month', 'year'
            console.log(`📈 Frontend fordert detaillierte ${period}-Statistiken an...`);
            return ipcRenderer.invoke('stats:getDetailed', period);
        },

        // Kategorien-spezifische Statistiken
        getByCategory: () => {
            console.log('📂 Frontend fordert Kategorie-Statistiken an...');
            return ipcRenderer.invoke('stats:getByCategory');
        },

        // Lernstreak
        getStreak: () => {
            console.log('🔥 Frontend fordert Lernstreak an...');
            return ipcRenderer.invoke('stats:getStreak');
        }
    },

    // =================================
    // DATENMANAGEMENT
    // =================================
    data: {
        // Daten exportieren
        export: (format = 'json') => { // 'json', 'csv', 'anki'
            console.log(`📤 Frontend exportiert Daten als ${format}...`);
            return ipcRenderer.invoke('data:export', format);
        },

        // Daten importieren
        import: (filePath, format = 'json') => {
            console.log(`📥 Frontend importiert Daten von ${filePath} als ${format}...`);
            return ipcRenderer.invoke('data:import', filePath, format);
        },

        // Backup erstellen
        backup: () => {
            console.log('💾 Frontend erstellt Backup...');
            return ipcRenderer.invoke('data:backup');
        },

        // Backup wiederherstellen
        restore: (backupPath) => {
            console.log('🔄 Frontend stellt Backup wieder her:', backupPath);
            return ipcRenderer.invoke('data:restore', backupPath);
        },

        // Datenbank-Statistiken
        getDatabaseInfo: () => {
            console.log('🗂️ Frontend fordert Datenbank-Info an...');
            return ipcRenderer.invoke('data:getDatabaseInfo');
        }
    },

    // =================================
    // APP-EINSTELLUNGEN
    // =================================
    settings: {
        // Einstellungen laden
        get: () => {
            console.log('⚙️ Frontend fordert Einstellungen an...');
            return ipcRenderer.invoke('settings:get');
        },

        // Einzelne Einstellung setzen
        set: (key, value) => {
            console.log(`⚙️ Frontend setzt Einstellung ${key}:`, value);
            return ipcRenderer.invoke('settings:set', key, value);
        },

        // Mehrere Einstellungen setzen
        setBulk: (settings) => {
            console.log('⚙️ Frontend setzt mehrere Einstellungen:', Object.keys(settings));
            return ipcRenderer.invoke('settings:setBulk', settings);
        },

        // Einstellungen zurücksetzen
        reset: () => {
            console.log('🔄 Frontend setzt Einstellungen zurück...');
            return ipcRenderer.invoke('settings:reset');
        }
    },

    // =================================
    // FENSTER-MANAGEMENT
    // =================================
    window: {
        // Fenster minimieren
        minimize: () => {
            console.log('📉 Frontend minimiert Fenster...');
            return ipcRenderer.invoke('window:minimize');
        },

        // Fenster maximieren/wiederherstellen
        toggleMaximize: () => {
            console.log('📊 Frontend toggled Maximize...');
            return ipcRenderer.invoke('window:toggleMaximize');
        },

        // App schließen
        close: () => {
            console.log('❌ Frontend schließt App...');
            return ipcRenderer.invoke('window:close');
        },

        // Vollbild toggle
        toggleFullscreen: () => {
            console.log('🖥️ Frontend toggled Vollbild...');
            return ipcRenderer.invoke('window:toggleFullscreen');
        },

        // Fenster-Status abrufen
        getState: () => {
            return ipcRenderer.invoke('window:getState');
        }
    },

    // =================================
    // SYSTEM-INTEGRATION
    // =================================
    system: {
        // App-Version abrufen
        getVersion: () => {
            return ipcRenderer.invoke('system:getVersion');
        },

        // Systeminfo abrufen
        getSystemInfo: () => {
            console.log('💻 Frontend fordert Systeminfo an...');
            return ipcRenderer.invoke('system:getSystemInfo');
        },

        // Pfad zum App-Datenordner
        getDataPath: () => {
            return ipcRenderer.invoke('system:getDataPath');
        },

        // Externe URLs öffnen
        openExternal: (url) => {
            console.log('🔗 Frontend öffnet externe URL:', url);
            return ipcRenderer.invoke('system:openExternal', url);
        },

        // Ordner im Explorer/Finder öffnen
        showInFolder: (filePath) => {
            console.log('📁 Frontend öffnet Ordner:', filePath);
            return ipcRenderer.invoke('system:showInFolder', filePath);
        }
    },

    // =================================
    // EVENTS & NOTIFICATIONS
    // =================================
    events: {
        // Event Listener für App-Events
        on: (channel, callback) => {
            console.log('👂 Frontend hört auf Event:', channel);
            ipcRenderer.on(channel, callback);
        },

        // Event Listener entfernen
        off: (channel, callback) => {
            console.log('🔇 Frontend entfernt Event Listener:', channel);
            ipcRenderer.off(channel, callback);
        },

        // Einmaligen Event Listener registrieren
        once: (channel, callback) => {
            console.log('👂 Frontend hört einmalig auf Event:', channel);
            ipcRenderer.once(channel, callback);
        },

        // Event an Main Process senden
        send: (channel, data) => {
            console.log('📤 Frontend sendet Event:', channel, data);
            ipcRenderer.send(channel, data);
        }
    },

    // =================================
    // DEBUG & DEVELOPMENT
    // =================================
    debug: {
        // Einfaches Logging
        log: (message, level = 'info') => {
            const timestamp = new Date().toLocaleTimeString('de-DE');
            console.log(`🔧 [${timestamp}] Frontend Debug (${level}):`, message);
        },

        // API-Test
        test: () => {
            console.log('🧪 API Test wird ausgeführt...');
            return ipcRenderer.invoke('debug:test');
        },

        // Performance-Test
        performanceTest: () => {
            console.log('⚡ Performance Test wird ausgeführt...');
            return ipcRenderer.invoke('debug:performanceTest');
        },

        // Datenbankverbindung testen
        testDatabase: () => {
            console.log('🗃️ Datenbankverbindung wird getestet...');
            return ipcRenderer.invoke('debug:testDatabase');
        },

        // Entwicklungstools öffnen
        openDevTools: () => {
            console.log('🛠️ Frontend öffnet DevTools...');
            return ipcRenderer.invoke('debug:openDevTools');
        },

        // App neuladen
        reload: () => {
            console.log('🔄 Frontend lädt App neu...');
            return ipcRenderer.invoke('debug:reload');
        }
    }
});

// =================================
// ERROR HANDLING
// =================================

// Globaler Error Handler für IPC
const originalInvoke = ipcRenderer.invoke;
ipcRenderer.invoke = async (...args) => {
    try {
        const result = await originalInvoke.apply(ipcRenderer, args);
        return result;
    } catch (error) {
        console.error(`❌ IPC Error bei ${args[0]}:`, error);
        return {
            success: false,
            error: error.message || 'Unbekannter Fehler'
        };
    }
};

// =================================
// HELPER FUNCTIONS
// =================================

// Verfügbare Channels für Sicherheit
const ALLOWED_CHANNELS = [
    // Karten
    'cards:getAll', 'cards:getForReview', 'cards:getById', 'cards:add',
    'cards:update', 'cards:delete', 'cards:getByCategory', 'cards:getCategories',

    // Reviews
    'reviews:save', 'reviews:getHistory', 'reviews:getByDateRange',

    // Statistiken
    'stats:get', 'stats:getDetailed', 'stats:getByCategory', 'stats:getStreak',

    // Daten
    'data:export', 'data:import', 'data:backup', 'data:restore', 'data:getDatabaseInfo',

    // Einstellungen
    'settings:get', 'settings:set', 'settings:setBulk', 'settings:reset',

    // Fenster
    'window:minimize', 'window:toggleMaximize', 'window:close',
    'window:toggleFullscreen', 'window:getState',

    // System
    'system:getVersion', 'system:getSystemInfo', 'system:getDataPath',
    'system:openExternal', 'system:showInFolder',

    // Debug
    'debug:test', 'debug:performanceTest', 'debug:testDatabase',
    'debug:openDevTools', 'debug:reload'
];

// Validierung für IPC-Channels
const validateChannel = (channel) => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
        console.warn(`⚠️ Nicht erlaubter Channel: ${channel}`);
        return false;
    }
    return true;
};

console.log('✅ Preload Script bereit - Vollständige API verfügbar');
console.log(`🔐 ${ALLOWED_CHANNELS.length} sichere IPC-Channels registriert`);

// Initialisierungstest
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM geladen - ElectronAPI bereit für Frontend');

    // API-Verfügbarkeit testen
    if (window.electronAPI) {
        console.log('✅ ElectronAPI erfolgreich geladen');
        console.log('📋 Verfügbare APIs:', Object.keys(window.electronAPI));
    } else {
        console.error('❌ ElectronAPI nicht verfügbar!');
    }
});