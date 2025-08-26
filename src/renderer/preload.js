// src/renderer/preload.js - Einfache Version
const { contextBridge, ipcRenderer } = require('electron');

console.log('🔐 Preload Script wird geladen...');

// Sichere API für Frontend
contextBridge.exposeInMainWorld('electronAPI', {
    // Karten-Funktionen
    cards: {
        getAll: () => {
            console.log('📚 Frontend fordert alle Karten an...');
            return ipcRenderer.invoke('cards:getAll');
        },

        add: (cardData) => {
            console.log('➕ Frontend fügt Karte hinzu:', cardData.front);
            return ipcRenderer.invoke('cards:add', cardData);
        },

        delete: (cardId) => {
            console.log('🗑️ Frontend löscht Karte:', cardId);
            return ipcRenderer.invoke('cards:delete', cardId);
        }
    },

    // Debug-Funktionen
    debug: {
        log: (message) => console.log('🔧 Frontend Debug:', message),
        test: () => console.log('🧪 API Test erfolgreich!')
    }
});

console.log('✅ Preload Script bereit - API verfügbar');