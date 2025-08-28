// src/renderer/app.js - Frontend Logic für sichere Electron API

class FlashCardApp {
    constructor() {
        // App State
        this.currentSession = null;
        this.sessionStats = {
            correct: 0,
            wrong: 0,
            total: 0
        };
        this.isFlipped = false;
        this.currentCardIndex = 0;

        // DOM Elements
        this.elements = {};

        // Initialisierung
        this.init();
    }

    async init() {
        console.log('FlashCard App wird initialisiert...');

        try {
            // DOM Elemente binden
            this.bindElements();

            // Event Listeners registrieren
            this.bindEvents();

            // Loading Screen verstecken
            await this.hideLoadingScreen();

            // Initiale Daten laden
            await this.loadInitialData();

            console.log('App erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler beim Initialisieren:', error);
            this.showNotification('Fehler beim Starten der App', 'error');
        }
    }

    bindElements() {
        this.elements = {
            // Loading & App Container
            loadingScreen: document.getElementById('loadingScreen'),
            appContainer: document.getElementById('appContainer'),

            // Navigation
            navTabs: document.querySelectorAll('.nav-tab'),
            tabContents: document.querySelectorAll('.tab-content'),

            // Study Tab
            startSession: document.getElementById('startSession'),
            studyControls: document.getElementById('studyControls'),
            flashcard: document.getElementById('flashcard'),
            cardFront: document.getElementById('cardFront'),
            cardBack: document.getElementById('cardBack'),
            flipCard: document.getElementById('flipCard'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),

            // Rating Buttons
            rateHard: document.getElementById('rateHard'),
            rateNormal: document.getElementById('rateNormal'),
            rateEasy: document.getElementById('rateEasy'),

            // Session Stats
            sessionCorrect: document.getElementById('sessionCorrect'),
            sessionWrong: document.getElementById('sessionWrong'),
            sessionAccuracy: document.getElementById('sessionAccuracy'),

            // Manage Tab
            frontInput: document.getElementById('frontInput'),
            backInput: document.getElementById('backInput'),
            categoryInput: document.getElementById('categoryInput'),
            addCard: document.getElementById('addCard'),
            cardsList: document.getElementById('cardsList'),

            // Stats Tab
            totalCards: document.getElementById('totalCards'),
            totalReviews: document.getElementById('totalReviews'),
            todayReviews: document.getElementById('todayReviews'),
            accuracy: document.getElementById('accuracy'),
            refreshStats: document.getElementById('refreshStats'),
            exportData: document.getElementById('exportData'),

            // Notification
            notification: document.getElementById('notification'),
            notificationText: document.querySelector('.notification-text'),
            notificationClose: document.querySelector('.notification-close')
        };
    }

    bindEvents() {
        // Navigation Tabs
        this.elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Study Controls
        this.elements.startSession.addEventListener('click', () => this.startSession());
        this.elements.flipCard.addEventListener('click', () => this.flipCard());
        this.elements.flashcard.addEventListener('click', () => this.flipCard());

        // Rating Buttons
        this.elements.rateHard.addEventListener('click', () => this.rateCard(1));
        this.elements.rateNormal.addEventListener('click', () => this.rateCard(2));
        this.elements.rateEasy.addEventListener('click', () => this.rateCard(3));

        // Manage Controls
        this.elements.addCard.addEventListener('click', () => this.addCard());

        // Stats Controls
        this.elements.refreshStats.addEventListener('click', () => this.loadStats());
        this.elements.exportData.addEventListener('click', () => this.exportData());

        // Notification Close
        this.elements.notificationClose.addEventListener('click', () => this.hideNotification());

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Auto-hide notification
        setTimeout(() => this.hideNotification(), 5000);
    }

    async hideLoadingScreen() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
                this.elements.appContainer.style.display = 'block';
                resolve();
            }, 1500);
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadCards(),
            this.loadStats()
        ]);
    }

    // =================================
    // NAVIGATION
    // =================================

    switchTab(tabName) {
        // Tab-Navigation
        this.elements.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Daten für spezifische Tabs laden
        if (tabName === 'manage') {
            this.loadCards();
        } else if (tabName === 'stats') {
            this.loadStats();
        }

        console.log(`Tab gewechselt zu: ${tabName}`);
    }

    // =================================
    // STUDY SESSION
    // =================================

    async startSession() {
        try {
            console.log('Starte Lernsession...');

            // Karten für Review laden
            const response = await window.electronAPI.cards.getForReview(20);

            if (!response.success) {
                throw new Error(response.error);
            }

            this.currentSession = response.data;

            if (this.currentSession.length === 0) {
                this.showNotification('Keine Karten für Review verfügbar! Fügen Sie neue Karten hinzu oder warten Sie auf das nächste Review.', 'warning');
                return;
            }

            // UI umschalten
            this.elements.startSession.style.display = 'none';
            this.elements.studyControls.classList.add('active');

            // Session Stats zurücksetzen
            this.sessionStats = { correct: 0, wrong: 0, total: 0 };
            this.currentCardIndex = 0;
            this.updateSessionStats();

            // Erste Karte anzeigen
            this.showCurrentCard();

            this.showNotification(`Session gestartet! ${this.currentSession.length} Karten bereit.`, 'success');
        } catch (error) {
            console.error('Fehler beim Starten der Session:', error);
            this.showNotification('Fehler beim Starten der Session: ' + error.message, 'error');
        }
    }

    showCurrentCard() {
        if (!this.currentSession || this.currentCardIndex >= this.currentSession.length) {
            this.endSession();
            return;
        }

        const card = this.currentSession[this.currentCardIndex];

        // Karte zurückdrehen
        this.elements.flashcard.classList.remove('flipped');
        this.isFlipped = false;

        // Inhalt setzen
        this.elements.cardFront.innerHTML = `
            <div>
                <h3 style="margin-bottom: 1.5rem; color: #a8e6cf;">Frage</h3>
                <p style="font-size: 1.6rem; line-height: 1.4;">${this.escapeHtml(card.front)}</p>
                <div style="margin-top: 2rem; font-size: 1rem; opacity: 0.8;">
                    ${card.category}
                </div>
                <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.6;">
                    Klicken zum Umdrehen
                </div>
            </div>
        `;

        this.elements.cardBack.innerHTML = `
            <div>
                <h3 style="margin-bottom: 1.5rem; color: #ffd93d;">Antwort</h3>
                <p style="font-size: 1.6rem; line-height: 1.4;">${this.escapeHtml(card.back)}</p>
                <div style="margin-top: 2rem; font-size: 1rem; opacity: 0.8;">
                    ${card.category} | ${card.reviewCount || 0} mal gelernt
                </div>
                <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.6;">
                    Bewerten Sie Ihr Wissen
                </div>
            </div>
        `;

        // Progress aktualisieren
        this.updateProgress();
    }

    updateProgress() {
        if (!this.currentSession) return;

        const progress = ((this.currentCardIndex + 1) / this.currentSession.length) * 100;
        this.elements.progressFill.style.width = Math.min(progress, 100) + '%';
        this.elements.progressText.textContent = `${this.currentCardIndex + 1} / ${this.currentSession.length} Karten`;
    }

    flipCard() {
        if (!this.currentSession || this.currentCardIndex >= this.currentSession.length) return;

        this.elements.flashcard.classList.toggle('flipped');
        this.isFlipped = !this.isFlipped;
    }

    async rateCard(quality) {
        if (!this.currentSession || this.currentCardIndex >= this.currentSession.length) return;

        const card = this.currentSession[this.currentCardIndex];
        const responseTime = 3000; // Vereinfacht

        try {
            // Review speichern
            const response = await window.electronAPI.reviews.save({
                cardId: card.id,
                quality: quality,
                responseTime: responseTime
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            // Session Stats aktualisieren
            this.sessionStats.total++;
            if (quality >= 2) {
                this.sessionStats.correct++;
            } else {
                this.sessionStats.wrong++;
            }

            this.updateSessionStats();

            // Visual Feedback
            const flashcard = this.elements.flashcard;
            if (quality >= 2) {
                flashcard.style.boxShadow = '0 0 40px rgba(34, 197, 94, 0.8)';
                this.showNotification('Richtig! Gut gemacht!', 'success');
            } else {
                flashcard.style.boxShadow = '0 0 40px rgba(239, 68, 68, 0.8)';
                this.showNotification('Schwierig! Weiter üben!', 'warning');
            }

            // Nächste Karte
            setTimeout(() => {
                flashcard.style.boxShadow = '';
                this.currentCardIndex++;

                if (this.currentCardIndex >= this.currentSession.length) {
                    setTimeout(() => this.endSession(), 1000);
                } else {
                    this.showCurrentCard();
                }
            }, 1200);

        } catch (error) {
            console.error('Fehler beim Speichern des Reviews:', error);
            this.showNotification('Fehler beim Speichern des Reviews: ' + error.message, 'error');
        }
    }

    updateSessionStats() {
        this.elements.sessionCorrect.textContent = this.sessionStats.correct;
        this.elements.sessionWrong.textContent = this.sessionStats.wrong;

        const accuracy = this.sessionStats.total > 0
            ? Math.round((this.sessionStats.correct / this.sessionStats.total) * 100)
            : 0;
        this.elements.sessionAccuracy.textContent = accuracy + '%';
    }

    endSession() {
        console.log('Session beendet');

        // UI zurücksetzen
        this.elements.studyControls.classList.remove('active');
        this.elements.startSession.style.display = 'block';

        // Session abgeschlossen anzeigen
        const accuracy = this.sessionStats.total > 0
            ? Math.round((this.sessionStats.correct / this.sessionStats.total) * 100)
            : 0;

        this.elements.cardFront.innerHTML = `
            <div>
                <h2>Session abgeschlossen!</h2>
                <p style="margin: 1rem 0;">
                    <strong>${this.sessionStats.total}</strong> Karten gelernt<br>
                    <strong>${accuracy}%</strong> Genauigkeit<br>
                    <strong>+${this.sessionStats.total * 10}</strong> XP erhalten
                </p>
            </div>
        `;

        this.elements.cardBack.innerHTML = '';

        // Progress auf 100%
        this.elements.progressFill.style.width = '100%';

        // Session zurücksetzen
        this.currentSession = null;
        this.currentCardIndex = 0;

        // Stats neu laden
        this.loadStats();

        this.showNotification(`Session beendet! ${accuracy}% Genauigkeit`, 'success');
    }

    // =================================
    // CARD MANAGEMENT
    // =================================

    async loadCards() {
        try {
            console.log('Lade Karten...');

            const response = await window.electronAPI.cards.getAll();

            if (!response.success) {
                throw new Error(response.error);
            }

            this.renderCards(response.data);

        } catch (error) {
            console.error('Fehler beim Laden der Karten:', error);
            this.showNotification('Fehler beim Laden der Karten: ' + error.message, 'error');
        }
    }

    renderCards(cards) {
        const cardsList = this.elements.cardsList;

        if (cards.length === 0) {
            cardsList.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.6); padding: 3rem;">
                    <h3>Noch keine Karten vorhanden</h3>
                    <p>Erstellen Sie Ihre erste Karte mit dem Formular oben!</p>
                </div>
            `;
            return;
        }

        // Karten nach Kategorie gruppieren
        const cardsByCategory = this.groupCardsByCategory(cards);

        let html = '';
        Object.entries(cardsByCategory).forEach(([category, categoryCards]) => {
            html += `
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #f093fb; margin-bottom: 1rem; font-size: 1.3rem;">
                        ${category} (${categoryCards.length})
                    </h4>
            `;

            categoryCards.forEach((card, index) => {
                const nextReview = this.calculateNextReview(card);

                html += `
                    <div class="card-item" style="animation-delay: ${index * 100}ms;">
                        <div class="card-item-content">
                            <div style="margin-bottom: 0.8rem;">
                                <strong>Frage:</strong> ${this.escapeHtml(card.front)}
                            </div>
                            <div style="margin-bottom: 0.8rem;">
                                <strong>Antwort:</strong> ${this.escapeHtml(card.back)}
                            </div>
                            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                                ${card.reviewCount || 0} mal gelernt | 
                                Nächste Wiederholung: ${nextReview} |
                                Schwierigkeit: ${'★'.repeat(Math.min(Math.round(card.difficulty || 1), 5))}
                            </div>
                        </div>
                        <div class="card-item-actions">
                            <button class="btn btn-danger btn-small" onclick="app.deleteCard(${card.id})">
                                Löschen
                            </button>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        });

        cardsList.innerHTML = html;
    }

    groupCardsByCategory(cards) {
        return cards.reduce((groups, card) => {
            const category = card.category || 'Allgemein';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(card);
            return groups;
        }, {});
    }

    calculateNextReview(card) {
        if (!card.lastReviewed) {
            return 'Neu';
        }

        const lastReviewed = new Date(card.lastReviewed);
        const nextReview = new Date(lastReviewed.getTime() + ((card.interval || 1) * 24 * 60 * 60 * 1000));

        if (nextReview <= new Date()) {
            return 'Jetzt verfügbar';
        }

        return nextReview.toLocaleDateString('de-DE');
    }

    async addCard() {
        const front = this.elements.frontInput.value.trim();
        const back = this.elements.backInput.value.trim();
        const category = this.elements.categoryInput.value.trim() || 'Allgemein';

        // Validation
        if (!front || !back) {
            this.showNotification('Bitte füllen Sie alle Pflichtfelder aus!', 'warning');
            return;
        }

        if (front.length > 500) {
            this.showNotification('Die Frage ist zu lang (max. 500 Zeichen)', 'warning');
            return;
        }

        if (back.length > 1000) {
            this.showNotification('Die Antwort ist zu lang (max. 1000 Zeichen)', 'warning');
            return;
        }

        try {
            console.log('Füge neue Karte hinzu...');

            const response = await window.electronAPI.cards.add({
                front: front,
                back: back,
                category: category
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            // Form zurücksetzen
            this.elements.frontInput.value = '';
            this.elements.backInput.value = '';
            this.elements.categoryInput.value = '';

            // Karten neu laden
            await this.loadCards();

            // Stats aktualisieren
            await this.loadStats();

            this.showNotification('Karte erfolgreich hinzugefügt!', 'success');

            // Button-Feedback
            const originalText = this.elements.addCard.textContent;
            this.elements.addCard.textContent = 'Hinzugefügt!';
            this.elements.addCard.style.background = 'linear-gradient(45deg, #22c55e, #10b981)';

            setTimeout(() => {
                this.elements.addCard.textContent = originalText;
                this.elements.addCard.style.background = '';
            }, 2000);

        } catch (error) {
            console.error('Fehler beim Hinzufügen der Karte:', error);
            this.showNotification('Fehler beim Hinzufügen: ' + error.message, 'error');
        }
    }

    async deleteCard(cardId) {
        if (!confirm('Sind Sie sicher, dass Sie diese Karte löschen möchten?')) {
            return;
        }

        try {
            console.log('Lösche Karte:', cardId);

            const response = await window.electronAPI.cards.delete(cardId);

            if (!response.success) {
                throw new Error(response.error);
            }

            // Karten neu laden
            await this.loadCards();

            // Stats aktualisieren
            await this.loadStats();

            this.showNotification('Karte erfolgreich gelöscht!', 'success');

        } catch (error) {
            console.error('Fehler beim Löschen der Karte:', error);
            this.showNotification('Fehler beim Löschen: ' + error.message, 'error');
        }
    }

    // =================================
    // STATISTICS
    // =================================

    async loadStats() {
        try {
            console.log('Lade Statistiken...');

            const response = await window.electronAPI.stats.get();

            if (!response.success) {
                throw new Error(response.error);
            }

            const stats = response.data;

            // Animate counter updates
            this.animateCounter(this.elements.totalCards, stats.totalCards);
            this.animateCounter(this.elements.totalReviews, stats.totalReviews);
            this.animateCounter(this.elements.todayReviews, stats.todayReviews);

            this.elements.accuracy.textContent = stats.accuracy + '%';

        } catch (error) {
            console.error('Fehler beim Laden der Statistiken:', error);
            this.showNotification('Fehler beim Laden der Statistiken: ' + error.message, 'error');
        }
    }

    animateCounter(element, targetValue, suffix = '') {
        if (!element) return;

        const startValue = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();

        const updateCounter = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);

            element.textContent = currentValue + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        updateCounter();
    }

    async exportData() {
        try {
            console.log('Exportiere Daten...');

            // Alle Daten sammeln
            const [cardsResponse, statsResponse] = await Promise.all([
                window.electronAPI.cards.getAll(),
                window.electronAPI.stats.get()
            ]);

            if (!cardsResponse.success || !statsResponse.success) {
                throw new Error('Fehler beim Sammeln der Daten');
            }

            const exportData = {
                cards: cardsResponse.data,
                stats: statsResponse.data,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            // JSON Download
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `flashcards-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            this.showNotification('Daten erfolgreich exportiert!', 'success');

        } catch (error) {
            console.error('Fehler beim Exportieren:', error);
            this.showNotification('Fehler beim Exportieren: ' + error.message, 'error');
        }
    }

    // =================================
    // KEYBOARD SHORTCUTS
    // =================================

    handleKeyboard(event) {
        // Ignore wenn in Input-Feldern getippt wird
        if (event.target.tagName.toLowerCase() === 'textarea' ||
            event.target.tagName.toLowerCase() === 'input') {
            return;
        }

        switch (event.key.toLowerCase()) {
            case ' ':
            case 'enter':
                event.preventDefault();
                this.flipCard();
                break;
            case '1':
                event.preventDefault();
                this.rateCard(1);
                break;
            case '2':
                event.preventDefault();
                this.rateCard(2);
                break;
            case '3':
                event.preventDefault();
                this.rateCard(3);
                break;
            case 'f':
                event.preventDefault();
                this.flipCard();
                break;
            case 's':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.startSession();
                }
                break;
        }
    }

    // =================================
    // NOTIFICATIONS
    // =================================

    showNotification(message, type = 'info') {
        const notification = this.elements.notification;
        const text = this.elements.notificationText;

        text.textContent = message;

        // Typ-spezifische Styling
        notification.className = `notification show ${type}`;

        // Auto-hide nach 5 Sekunden
        setTimeout(() => {
            this.hideNotification();
        }, 5000);

        console.log(`Notification (${type}):`, message);
    }

    hideNotification() {
        this.elements.notification.classList.remove('show');
    }

    // =================================
    // UTILITY FUNCTIONS
    // =================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('de-DE');
    }

    // Error Handler
    handleError(error, context = 'Allgemein') {
        console.error(`Fehler in ${context}:`, error);
        this.showNotification(`Fehler: ${error.message}`, 'error');
    }
}

// =================================
// APP INITIALISIERUNG
// =================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM geladen, starte FlashCard App...');

    // Prüfe ob electronAPI verfügbar ist
    if (typeof window.electronAPI === 'undefined') {
        console.error('Electron API nicht verfügbar!');
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; color: white; text-align: center;">
                <div>
                    <h1>Fehler</h1>
                    <p>Die App läuft nicht in Electron.</p>
                    <p>Bitte starten Sie die App mit: <code>npm start</code></p>
                </div>
            </div>
        `;
        return;
    }

    // Globale App-Instanz erstellen
    window.app = new FlashCardApp();
});

// =================================
// ERROR HANDLERS
// =================================

window.addEventListener('error', (event) => {
    console.error('Unbehandelter Fehler:', event.error);
    if (window.app) {
        window.app.showNotification('Ein unerwarteter Fehler ist aufgetreten', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unbehandelte Promise Rejection:', event.reason);
    if (window.app) {
        window.app.showNotification('Ein Netzwerkfehler ist aufgetreten', 'error');
    }
});