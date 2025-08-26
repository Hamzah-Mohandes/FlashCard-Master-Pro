// src/main/index.js - Korrigierte Version
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let database;

// JSON-basierte Database (funktioniert immer)
class FlashCardDatabase {
    constructor() {
        this.isConnected = false;
        this.cards = [
            {
                id: 1,
                front: "Was ist React.js?",
                back: "Eine JavaScript-Bibliothek für Benutzeroberflächen, entwickelt von Meta",
                category: "Programmierung"
            },
            {
                id: 2,
                front: "Was ist JavaScript?",
                back: "Eine Programmiersprache für Web- und App-Entwicklung",
                category: "Programmierung"
            },
            {
                id: 3,
                front: "Was ist Electron?",
                back: "Framework für Desktop-Apps mit Web-Technologien",
                category: "Desktop Development"
            }
        ];
    }

    getAllCards() {
        return [...this.cards];
    }

    addCard(cardData) {
        const newCard = {
            id: Date.now(),
            front: cardData.front,
            back: cardData.back,
            category: cardData.category || 'Allgemein',
            createdAt: Date.now()
        };

        this.cards.push(newCard);
        return newCard;
    }

    deleteCard(cardId) {
        const initialLength = this.cards.length;
        this.cards = this.cards.filter(card => card.id !== parseInt(cardId));
        return { changes: initialLength - this.cards.length };
    }

    getCardsForReview(maxCards = 20) {
        return this.cards.slice(0, maxCards);
    }

    saveReview(reviewData) {
        console.log('Review gespeichert:', reviewData);
        return true;
    }
}

function createWindow() {
    console.log('Erstelle Hauptfenster...');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false
    });

    // KOMPLETTES HTML inline (funktioniert garantiert)
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>FlashCard Master Pro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            min-height: 100vh;
            color: white;
            padding: 2rem;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            border-radius: 30px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 30px 80px rgba(0,0,0,0.3);
            padding: 3rem;
            min-height: 80vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .tabs {
            display: flex;
            justify-content: center;
            margin-bottom: 3rem;
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
            padding: 0.5rem;
        }
        
        .tab {
            flex: 1;
            padding: 1.2rem 2rem;
            border: none;
            border-radius: 15px;
            background: transparent;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .tab.active {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* KARTEIKARTE */
        .card-container {
            perspective: 1500px;
            margin: 3rem auto;
            width: 100%;
            max-width: 700px;
            height: 400px;
        }
        
        .flashcard {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
        }
        
        .flashcard:hover:not(.flipped) {
            transform: translateY(-10px) rotateY(5deg);
        }
        
        .flashcard.flipped {
            transform: rotateY(180deg);
        }
        
        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            box-shadow: 0 25px 70px rgba(0,0,0,0.4);
            text-align: center;
            font-size: 1.5rem;
            font-weight: 500;
            line-height: 1.6;
        }
        
        .card-front {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .card-back {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            transform: rotateY(180deg);
        }
        
        .btn {
            padding: 1.2rem 2.5rem;
            border: none;
            border-radius: 15px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
            margin: 0.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }
        
        .btn-primary { background: linear-gradient(45deg, #667eea, #764ba2); }
        .btn-secondary { background: linear-gradient(45deg, #6b7280, #4b5563); }
        .btn-success { background: linear-gradient(45deg, #22c55e, #10b981); }
        .btn-warning { background: linear-gradient(45deg, #f59e0b, #d97706); }
        .btn-danger { background: linear-gradient(45deg, #ef4444, #dc2626); }
        
        .controls { text-align: center; margin: 3rem 0; }
        .rating-controls { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        
        .card-form {
            background: rgba(255,255,255,0.15);
            border-radius: 25px;
            padding: 3rem;
            margin-bottom: 3rem;
            backdrop-filter: blur(15px);
        }
        
        .form-group { margin-bottom: 2rem; }
        .form-group label {
            display: block;
            margin-bottom: 0.8rem;
            font-weight: 600;
            font-size: 1.2rem;
        }
        
        .form-group textarea, .form-group input {
            width: 100%;
            padding: 1.5rem;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 15px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1rem;
            resize: vertical;
        }
        
        .form-group textarea { min-height: 120px; }
        .form-group input::placeholder, .form-group textarea::placeholder {
            color: rgba(255,255,255,0.6);
        }
        
        .cards-list { max-height: 400px; overflow-y: auto; }
        .card-item {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 1.5rem;
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FlashCard Master Pro</h1>
            <p>Intelligente Karteikarten für effektives Lernen</p>
        </div>

        <div class="tabs">
            <button class="tab active" data-tab="study">Lernen</button>
            <button class="tab" data-tab="manage">Verwalten</button>
        </div>

        <!-- LERNEN TAB -->
        <div id="study" class="tab-content active">
            <div class="card-container">
                <div class="flashcard" id="flashcard">
                    <div class="card-face card-front">
                        <div id="frontContent">
                            <h2>Bereit zum Lernen!</h2>
                            <p>Klicken Sie "Session starten"</p>
                        </div>
                    </div>
                    <div class="card-face card-back">
                        <div id="backContent">
                            <h2>Antwort</h2>
                            <p>Hier erscheint die Antwort</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="controls">
                <button class="btn btn-primary" id="startSession">Session starten</button>
                
                <div id="studyControls" style="display: none;">
                    <button class="btn btn-secondary" id="flipCard">Karte umdrehen</button>
                    <div class="rating-controls">
                        <button class="btn btn-danger" id="rateHard">Schwer</button>
                        <button class="btn btn-warning" id="rateNormal">Normal</button>
                        <button class="btn btn-success" id="rateEasy">Einfach</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- VERWALTEN TAB -->
        <div id="manage" class="tab-content">
            <div class="card-form">
                <h3>Neue Karteikarte erstellen</h3>
                
                <div class="form-group">
                    <label>FRAGE (Vorderseite):</label>
                    <textarea id="frontInput" placeholder="Geben Sie Ihre Frage ein..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>ANTWORT (Rückseite):</label>
                    <textarea id="backInput" placeholder="Geben Sie die Antwort ein..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Kategorie:</label>
                    <input id="categoryInput" type="text" placeholder="z.B. Programmierung">
                </div>
                
                <button class="btn btn-primary" id="addCard">Karte hinzufügen</button>
            </div>

            <div class="card-form">
                <h3>Ihre Karten</h3>
                <div id="cardsList" class="cards-list">
                    <p>Karten werden hier angezeigt...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('App startet...');
        
        // OHNE electronAPI - direkte Implementierung
        let cards = [
            {
                id: 1,
                front: "Was ist React?",
                back: "JavaScript-Bibliothek für UI",
                category: "Programmierung"
            },
            {
                id: 2,
                front: "Was ist 5 + 3?",
                back: "8",
                category: "Mathematik"
            }
        ];
        
        let currentSession = [];
        let currentCardIndex = 0;
        let isFlipped = false;
        
        // Tab Navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
                
                if (tab.dataset.tab === 'manage') {
                    renderCards();
                }
            });
        });
        
        // Session starten
        document.getElementById('startSession').addEventListener('click', () => {
            console.log('Session gestartet');
            
            currentSession = [...cards];
            currentCardIndex = 0;
            
            document.getElementById('startSession').style.display = 'none';
            document.getElementById('studyControls').style.display = 'block';
            
            showCurrentCard();
        });
        
        // Karte anzeigen
        function showCurrentCard() {
            if (currentCardIndex >= currentSession.length) {
                alert('Session beendet!');
                document.getElementById('studyControls').style.display = 'none';
                document.getElementById('startSession').style.display = 'block';
                return;
            }
            
            const card = currentSession[currentCardIndex];
            
            // Karte zurückdrehen
            document.getElementById('flashcard').classList.remove('flipped');
            isFlipped = false;
            
            // NUR Vorderseite setzen
            document.getElementById('frontContent').innerHTML = 
                '<h2>FRAGE</h2><p>' + card.front + '</p>';
            
            // Rückseite vorbereiten
            document.getElementById('backContent').innerHTML = 
                '<h2>ANTWORT</h2><p>' + card.back + '</p>';
        }
        
        // Karte umdrehen
        function flipCard() {
            const flashcard = document.getElementById('flashcard');
            
            if (!isFlipped) {
                flashcard.classList.add('flipped');
                isFlipped = true;
                console.log('Zur Antwort gedreht');
            } else {
                flashcard.classList.remove('flipped');
                isFlipped = false;
                console.log('Zur Frage gedreht');
            }
        }
        
        document.getElementById('flipCard').addEventListener('click', flipCard);
        document.getElementById('flashcard').addEventListener('click', flipCard);
        
        // Bewertung
        document.getElementById('rateHard').addEventListener('click', () => rateCard(1));
        document.getElementById('rateNormal').addEventListener('click', () => rateCard(2));
        document.getElementById('rateEasy').addEventListener('click', () => rateCard(3));
        
        function rateCard(quality) {
            console.log('Bewertet mit:', quality);
            
            setTimeout(() => {
                currentCardIndex++;
                showCurrentCard();
            }, 1000);
        }
        
        // Neue Karte hinzufügen
        document.getElementById('addCard').addEventListener('click', () => {
            const front = document.getElementById('frontInput').value.trim();
            const back = document.getElementById('backInput').value.trim();
            const category = document.getElementById('categoryInput').value.trim() || 'Allgemein';
            
            if (!front || !back) {
                alert('Bitte beide Felder ausfüllen!');
                return;
            }
            
            const newCard = {
                id: Date.now(),
                front: front,
                back: back,
                category: category
            };
            
            cards.push(newCard);
            
            // Form leeren
            document.getElementById('frontInput').value = '';
            document.getElementById('backInput').value = '';
            document.getElementById('categoryInput').value = '';
            
            renderCards();
            
            alert('Karte hinzugefügt!');
        });
        
        // Karten anzeigen
        function renderCards() {
            const cardsList = document.getElementById('cardsList');
            
            let html = '';
            cards.forEach(card => {
                html += '<div class="card-item">';
                html += '<div>';
                html += '<strong>FRAGE:</strong> ' + card.front + '<br>';
                html += '<strong>ANTWORT:</strong> ' + card.back + '<br>';
                html += '<small>Kategorie: ' + card.category + '</small>';
                html += '</div>';
                html += '<button class="btn btn-danger" onclick="deleteCard(' + card.id + ')">Löschen</button>';
                html += '</div>';
            });
            
            cardsList.innerHTML = html || '<p>Keine Karten vorhanden</p>';
        }
        
        function deleteCard(cardId) {
            if (confirm('Karte löschen?')) {
                cards = cards.filter(card => card.id !== cardId);
                renderCards();
            }
        }
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'textarea' || 
                e.target.tagName.toLowerCase() === 'input') return;
                
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    flipCard();
                    break;
                case '1': rateCard(1); break;
                case '2': rateCard(2); break;
                case '3': rateCard(3); break;
            }
        });
        
        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            console.log('App geladen!');
            renderCards();
        });
        
        // Global functions
        window.deleteCard = deleteCard;
    </script>
</body>
</html>`;

    // HTML direkt laden
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        console.log('Anwendung bereit!');
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App starten
app.whenReady().then(() => {
    console.log('Electron startet...');
    database = new FlashCardDatabase();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});