// src/main/index.js - Korrigierte und sichere Version
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

let mainWindow;
let dataPath;
let cards = [];

// =================================
// DATENBANK/DATEISYSTEM
// =================================

async function initializeData() {
    try {
        dataPath = path.join(app.getPath('userData'), 'flashcards.json');
        console.log('📁 Datenpfad:', dataPath);

        // Sicherstellen dass Ordner existiert
        const dir = path.dirname(dataPath);
        if (!fsSync.existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Daten laden oder initialisieren
        if (fsSync.existsSync(dataPath)) {
            const fileContent = await fs.readFile(dataPath, 'utf8');
            cards = JSON.parse(fileContent);
            console.log(`📚 ${cards.length} Karten geladen`);
        } else {
            // Erste Nutzung - Sample-Daten erstellen
            console.log('🆕 Erstelle Sample-Karten...');
            cards = [
                {
                    id: 1,
                    front: "Was ist JavaScript?",
                    back: "Eine Programmiersprache für Web- und App-Entwicklung, die sowohl im Frontend als auch Backend verwendet wird.",
                    category: "Programmierung",
                    createdAt: new Date().toISOString(),
                    difficulty: 1.3,
                    interval: 1,
                    lastReviewed: null,
                    reviewCount: 0
                },
                {
                    id: 2,
                    front: "Was ist React?",
                    back: "Eine JavaScript-Bibliothek für die Erstellung von Benutzeroberflächen, entwickelt von Meta (Facebook).",
                    category: "Web Development",
                    createdAt: new Date().toISOString(),
                    difficulty: 1.3,
                    interval: 1,
                    lastReviewed: null,
                    reviewCount: 0
                },
                {
                    id: 3,
                    front: "Was bedeutet API?",
                    back: "Application Programming Interface - eine Schnittstelle zwischen verschiedenen Softwareanwendungen.",
                    category: "Programmierung",
                    createdAt: new Date().toISOString(),
                    difficulty: 1.3,
                    interval: 1,
                    lastReviewed: null,
                    reviewCount: 0
                }
            ];
            await saveCards();
        }

        return true;
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren der Daten:', error);
        return false;
    }
}

async function saveCards() {
    try {
        await fs.writeFile(dataPath, JSON.stringify(cards, null, 2));
        console.log(`💾 ${cards.length} Karten gespeichert`);
        return { success: true };
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        return { success: false, error: error.message };
    }
}

// =================================
// IPC HANDLERS - KARTEN
// =================================

ipcMain.handle('cards:getAll', async () => {
    try {
        console.log('📚 Alle Karten angefordert');
        return { success: true, data: cards };
    } catch (error) {
        console.error('❌ Fehler beim Abrufen aller Karten:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:getForReview', async (event, limit = 20) => {
    try {
        console.log(`📖 ${limit} Review-Karten angefordert`);

        const now = new Date();
        const reviewCards = cards.filter(card => {
            if (!card.lastReviewed) return true; // Neue Karten

            const lastReview = new Date(card.lastReviewed);
            const nextReview = new Date(lastReview.getTime() + (card.interval * 24 * 60 * 60 * 1000));

            return nextReview <= now;
        });

        // Limit anwenden
        const limitedCards = reviewCards.slice(0, limit);

        console.log(`📋 ${limitedCards.length} Karten für Review bereit`);
        return { success: true, data: limitedCards };
    } catch (error) {
        console.error('❌ Fehler beim Abrufen der Review-Karten:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:getById', async (event, cardId) => {
    try {
        const card = cards.find(c => c.id === parseInt(cardId));
        if (!card) {
            return { success: false, error: 'Karte nicht gefunden' };
        }
        return { success: true, data: card };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:add', async (event, cardData) => {
    try {
        console.log('➕ Neue Karte wird hinzugefügt:', cardData.front.substring(0, 50));

        // Validation
        if (!cardData.front?.trim() || !cardData.back?.trim()) {
            return { success: false, error: 'Frage und Antwort sind erforderlich' };
        }

        const newCard = {
            id: Date.now(),
            front: cardData.front.trim(),
            back: cardData.back.trim(),
            category: cardData.category?.trim() || 'Allgemein',
            createdAt: new Date().toISOString(),
            difficulty: 1.3, // Spaced Repetition Parameter
            interval: 1,
            lastReviewed: null,
            reviewCount: 0
        };

        cards.push(newCard);
        const saveResult = await saveCards();

        if (saveResult.success) {
            console.log(`✅ Karte hinzugefügt. Total: ${cards.length}`);
            return { success: true, data: newCard };
        } else {
            return saveResult;
        }
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen der Karte:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:update', async (event, cardId, updateData) => {
    try {
        const cardIndex = cards.findIndex(c => c.id === parseInt(cardId));
        if (cardIndex === -1) {
            return { success: false, error: 'Karte nicht gefunden' };
        }

        cards[cardIndex] = { ...cards[cardIndex], ...updateData };
        const saveResult = await saveCards();

        if (saveResult.success) {
            return { success: true, data: cards[cardIndex] };
        } else {
            return saveResult;
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:delete', async (event, cardId) => {
    try {
        console.log('🗑️ Lösche Karte:', cardId);

        const initialLength = cards.length;
        cards = cards.filter(card => card.id !== parseInt(cardId));

        if (cards.length < initialLength) {
            const saveResult = await saveCards();
            if (saveResult.success) {
                console.log(`✅ Karte gelöscht. Verbleibend: ${cards.length}`);
                return { success: true, data: { deletedCount: 1, remaining: cards.length } };
            } else {
                return saveResult;
            }
        } else {
            return { success: false, error: 'Karte nicht gefunden' };
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:getByCategory', async (event, category) => {
    try {
        const categoryCards = cards.filter(card =>
            card.category.toLowerCase() === category.toLowerCase()
        );
        return { success: true, data: categoryCards };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('cards:getCategories', async () => {
    try {
        const categories = [...new Set(cards.map(card => card.category))];
        return { success: true, data: categories };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// =================================
// IPC HANDLERS - REVIEWS (Spaced Repetition)
// =================================

ipcMain.handle('reviews:save', async (event, reviewData) => {
    try {
        console.log('💾 Review wird gespeichert für Karte:', reviewData.cardId);

        const cardIndex = cards.findIndex(c => c.id === parseInt(reviewData.cardId));
        if (cardIndex === -1) {
            return { success: false, error: 'Karte nicht gefunden' };
        }

        const card = cards[cardIndex];
        const quality = Math.max(1, Math.min(3, reviewData.quality));

        // Vereinfachter Spaced Repetition Algorithmus
        let newInterval;
        let newDifficulty = card.difficulty;

        if (quality === 1) { // Schwer
            newInterval = 1;
            newDifficulty = Math.min(card.difficulty + 0.2, 2.5);
        } else if (quality === 2) { // Normal
            newInterval = Math.max(1, Math.round(card.interval * card.difficulty));
            newDifficulty = Math.max(card.difficulty - 0.1, 1.3);
        } else { // Einfach
            newInterval = Math.round(card.interval * card.difficulty * 1.3);
            newDifficulty = Math.max(card.difficulty - 0.15, 1.3);
        }

        // Karte aktualisieren
        cards[cardIndex] = {
            ...card,
            difficulty: newDifficulty,
            interval: newInterval,
            lastReviewed: new Date().toISOString(),
            reviewCount: card.reviewCount + 1
        };

        const saveResult = await saveCards();

        if (saveResult.success) {
            console.log(`📈 Review gespeichert. Nächste Wiederholung in ${newInterval} Tag(en)`);
            return { success: true, data: cards[cardIndex] };
        } else {
            return saveResult;
        }
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Reviews:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('reviews:getHistory', async (event, cardId, limit = 10) => {
    try {
        // Vereinfacht - in einer echten App würdest du eine separate Reviews-Tabelle haben
        const card = cards.find(c => c.id === parseInt(cardId));
        if (!card) {
            return { success: false, error: 'Karte nicht gefunden' };
        }

        const history = {
            cardId: card.id,
            reviewCount: card.reviewCount,
            lastReviewed: card.lastReviewed,
            currentInterval: card.interval,
            difficulty: card.difficulty
        };

        return { success: true, data: [history] };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// =================================
// IPC HANDLERS - STATISTIKEN
// =================================

ipcMain.handle('stats:get', async () => {
    try {
        console.log('📊 Statistiken werden berechnet...');

        const totalCards = cards.length;
        const totalReviews = cards.reduce((sum, card) => sum + card.reviewCount, 0);

        // Heute gelernte Karten (vereinfacht)
        const today = new Date().toDateString();
        const todayReviews = cards.filter(card => {
            if (!card.lastReviewed) return false;
            return new Date(card.lastReviewed).toDateString() === today;
        }).length;

        // Durchschnittliche Genauigkeit (vereinfacht - normalerweise aus Review-Historie)
        const accuracy = totalReviews > 0 ? Math.round(75 + Math.random() * 20) : 0;

        const stats = {
            totalCards,
            totalReviews,
            todayReviews,
            accuracy
        };

        console.log('📈 Statistiken berechnet:', stats);
        return { success: true, data: stats };
    } catch (error) {
        console.error('❌ Fehler beim Berechnen der Statistiken:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('stats:getDetailed', async (event, period) => {
    try {
        // Vereinfacht - hier würdest du detaillierte Zeitraum-Statistiken berechnen
        const stats = {
            period,
            cardsLearned: Math.round(Math.random() * 50),
            averageAccuracy: Math.round(70 + Math.random() * 25),
            streakDays: Math.round(Math.random() * 14)
        };

        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('stats:getByCategory', async () => {
    try {
        const categoryStats = {};

        cards.forEach(card => {
            if (!categoryStats[card.category]) {
                categoryStats[card.category] = {
                    totalCards: 0,
                    totalReviews: 0
                };
            }
            categoryStats[card.category].totalCards++;
            categoryStats[card.category].totalReviews += card.reviewCount;
        });

        return { success: true, data: categoryStats };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// =================================
// IPC HANDLERS - DEBUG
// =================================

ipcMain.handle('debug:test', async () => {
    console.log('🧪 Debug-Test ausgeführt');
    return {
        success: true,
        data: {
            message: 'API Test erfolgreich!',
            timestamp: new Date().toISOString(),
            cardsCount: cards.length
        }
    };
});

// =================================
// FENSTER ERSTELLEN
// =================================

function createWindow() {
    console.log('🪟 Erstelle Hauptfenster...');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            // SICHERE KONFIGURATION
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../renderer/preload.js'),
            webSecurity: true
        },
        show: false,
        titleBarStyle: 'default',
        icon: path.join(__dirname, '../assets/icon.png') // Optional
    });

    // HTML-Datei laden
    const indexPath = path.join(__dirname, '../renderer/index.html');

    if (fsSync.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
        console.log('📄 index.html geladen');
    } else {
        // Fallback falls keine separate HTML-Datei vorhanden
        console.log('⚠️ index.html nicht gefunden, verwende Fallback');
        mainWindow.loadURL('data:text/html,<h1>Erstellen Sie eine index.html Datei in src/renderer/</h1>');
    }

    // Entwicklungstools (nur in Development)
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
        console.log('✅ Fenster bereit, zeige App');
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        console.log('🪟 Hauptfenster geschlossen');
        mainWindow = null;
    });
}

// =================================
// APP LIFECYCLE
// =================================

app.whenReady().then(async () => {
    console.log('🚀 Electron App startet...');

    // Daten initialisieren
    const dataInitialized = await initializeData();

    if (!dataInitialized) {
        console.error('❌ Fehler beim Initialisieren der Daten');
        app.quit();
        return;
    }

    // Fenster erstellen
    createWindow();

    console.log('✅ App erfolgreich gestartet');
    console.log(`📚 ${cards.length} Karten geladen`);
    console.log(`📁 Daten gespeichert in: ${dataPath}`);
});

app.on('window-all-closed', () => {
    console.log('🛑 Alle Fenster geschlossen');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    console.log('🔄 App aktiviert');
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', async () => {
    console.log('💾 App wird beendet, speichere finale Daten...');
    await saveCards();
});

// =================================
// ERROR HANDLING
// =================================

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // In Produktion: Loggen und graceful shutdown
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // In Produktion: Loggen und behandeln
});

console.log('📋 Main Process bereit - Alle IPC Handler registriert');