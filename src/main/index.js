// src/main/index.js - MINIMAL VERSION DIE FUNKTIONIERT
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    console.log('🪟 Erstelle Fenster...');

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Inline HTML - funktioniert IMMER
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>FlashCard Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 30px;
            background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
            background-size: 400% 400%;
            animation: bg 10s ease infinite;
            min-height: 100vh;
            color: white;
        }
        
        @keyframes bg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.15);
            border-radius: 25px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        h1 {
            text-align: center;
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .status {
            background: rgba(34, 197, 94, 0.3);
            border: 2px solid rgba(34, 197, 94, 0.6);
            border-radius: 15px;
            padding: 1rem;
            text-align: center;
            margin: 2rem 0;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .card {
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 3rem;
            margin: 2rem 0;
            text-align: center;
            font-size: 1.5rem;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.3);
        }
        
        .card:hover {
            transform: translateY(-10px) rotateY(5deg);
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            background: rgba(255,255,255,0.25);
        }
        
        .btn {
            padding: 1.2rem 2.5rem;
            border: none;
            border-radius: 15px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 1rem 0.5rem;
            transition: all 0.3s ease;
            color: white;
            backdrop-filter: blur(10px);
        }
        
        .btn-primary { background: linear-gradient(45deg, #667eea, #764ba2); }
        .btn-success { background: linear-gradient(45deg, #22c55e, #10b981); }
        .btn-danger { background: linear-gradient(45deg, #ef4444, #dc2626); }
        .btn-warning { background: linear-gradient(45deg, #f59e0b, #d97706); }
        
        .btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
        }
        
        .controls {
            text-align: center;
            margin: 2rem 0;
        }
        
        .form {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 2rem;
            margin: 2rem 0;
        }
        
        .form input, .form textarea {
            width: 100%;
            padding: 1rem;
            margin: 0.5rem 0;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1rem;
        }
        
        .form input::placeholder, .form textarea::placeholder {
            color: rgba(255,255,255,0.7);
        }
        
        .debug {
            background: rgba(0,0,0,0.4);
            border-radius: 10px;
            padding: 1rem;
            margin-top: 2rem;
            font-family: monospace;
            font-size: 0.9rem;
            max-height: 150px;
            overflow-y: auto;
            border: 1px solid rgba(255,255,255,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 FlashCard Master Pro</h1>
        
        <div class="status" id="status">
            ✅ Electron läuft erfolgreich!
        </div>
        
        <div class="card" id="flashcard">
            <div id="cardContent">
                <h2>🎉 APP FUNKTIONIERT!</h2>
                <p>Klicken Sie die Buttons unten zum Testen</p>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn btn-primary" onclick="testBasic()">🧪 Basis Test</button>
            <button class="btn btn-success" onclick="flipCard()">🔄 Karte drehen</button>
            <button class="btn btn-warning" onclick="addTestCard()">➕ Test Karte</button>
            <button class="btn btn-danger" onclick="clearOutput()">🧽 Leeren</button>
        </div>
        
        <div class="form">
            <h3>➕ Neue Karte</h3>
            <input id="questionInput" placeholder="Frage eingeben..." type="text">
            <textarea id="answerInput" placeholder="Antwort eingeben..." rows="3"></textarea>
            <button class="btn btn-success" onclick="addCard()">✨ Hinzufügen</button>
        </div>
        
        <div class="debug" id="debugOutput">
            🔧 Debug-Ausgabe:<br>
        </div>
    </div>

    <script>
        console.log('🔧 JavaScript lädt...');
        
        let cards = [];
        let currentIndex = 0;
        let isFlipped = false;
        
        function log(message) {
            const debug = document.getElementById('debugOutput');
            const time = new Date().toLocaleTimeString();
            debug.innerHTML += \`[\${time}] \${message}<br>\`;
            debug.scrollTop = debug.scrollHeight;
            console.log('LOG:', message);
        }
        
        function testBasic() {
            log('🧪 Basis-Test gestartet');
            
            // Test 1: DOM Manipulation
            const card = document.getElementById('flashcard');
            card.style.background = 'rgba(34, 197, 94, 0.4)';
            
            setTimeout(() => {
                card.style.background = 'rgba(255,255,255,0.2)';
                log('✅ DOM Test erfolgreich');
            }, 1000);
            
            // Test 2: JavaScript Funktionalität
            const testArray = [1, 2, 3, 4, 5];
            const sum = testArray.reduce((a, b) => a + b, 0);
            log(\`📊 Array Test: Summe von [1,2,3,4,5] = \${sum}\`);
            
            // Test 3: Local Storage
            try {
                localStorage.setItem('test', 'funktioniert');
                const value = localStorage.getItem('test');
                log(\`💾 LocalStorage Test: \${value}\`);
            } catch (e) {
                log('❌ LocalStorage nicht verfügbar');
            }
            
            log('🎉 Alle Basis-Tests abgeschlossen');
        }
        
        function flipCard() {
            const card = document.getElementById('flashcard');
            const content = document.getElementById('cardContent');
            
            if (!isFlipped) {
                card.style.transform = 'rotateY(180deg)';
                content.innerHTML = \`
                    <h2>🔄 Rückseite!</h2>
                    <p>Die Karte wurde gedreht</p>
                    <small>Klicken Sie nochmal zum Zurückdrehen</small>
                \`;
                isFlipped = true;
                log('🔄 Karte umgedreht');
            } else {
                card.style.transform = 'rotateY(0deg)';
                content.innerHTML = \`
                    <h2>🎉 APP FUNKTIONIERT!</h2>
                    <p>Klicken Sie die Buttons unten zum Testen</p>
                \`;
                isFlipped = false;
                log('🔄 Karte zurückgedreht');
            }
        }
        
        function addTestCard() {
            const testQuestions = [
                {q: 'Was ist 2+2?', a: '4'},
                {q: 'Hauptstadt Frankreich?', a: 'Paris'}, 
                {q: 'Wer erfand JavaScript?', a: 'Brendan Eich'},
                {q: 'Was bedeutet HTML?', a: 'HyperText Markup Language'},
                {q: 'Wie viele Tage hat ein Jahr?', a: '365 (366 im Schaltjahr)'}
            ];
            
            const randomCard = testQuestions[Math.floor(Math.random() * testQuestions.length)];
            
            document.getElementById('questionInput').value = randomCard.q;
            document.getElementById('answerInput').value = randomCard.a;
            
            log(\`🎲 Test-Karte generiert: \${randomCard.q}\`);
        }
        
        function addCard() {
            const question = document.getElementById('questionInput').value.trim();
            const answer = document.getElementById('answerInput').value.trim();
            
            if (!question || !answer) {
                log('⚠️ Validation: Beide Felder müssen ausgefüllt sein');
                alert('Bitte beide Felder ausfüllen!');
                return;
            }
            
            const newCard = {
                id: Date.now(),
                question: question,
                answer: answer,
                created: new Date().toLocaleString('de-DE')
            };
            
            cards.push(newCard);
            
            // Form leeren
            document.getElementById('questionInput').value = '';
            document.getElementById('answerInput').value = '';
            
            log(\`✅ Neue Karte hinzugefügt: "\${question}"\`);
            log(\`📊 Gesamt Karten: \${cards.length}\`);
            
            // Karte anzeigen
            document.getElementById('cardContent').innerHTML = \`
                <h3>✨ Neue Karte hinzugefügt!</h3>
                <p><strong>Frage:</strong> \${question}</p>
                <p><strong>Antwort:</strong> \${answer}</p>
                <small>Gesamt: \${cards.length} Karten</small>
            \`;
        }
        
        function clearOutput() {
            document.getElementById('debugOutput').innerHTML = '🔧 Debug-Ausgabe:<br>';
            log('🧽 Debug-Output geleert');
        }
        
        // Beim Laden
        document.addEventListener('DOMContentLoaded', () => {
            log('🚀 DOM geladen - App bereit!');
            log('💻 User Agent: ' + navigator.userAgent);
            log('🌐 Platform: ' + navigator.platform);
            
            // Test ob Electron läuft
            if (typeof require !== 'undefined') {
                log('✅ Node.js/Electron Umgebung erkannt');
                log('📦 Node Version: ' + process.versions.node);
                log('⚡ Electron Version: ' + process.versions.electron);
            } else {
                log('⚠️ Läuft in Browser (nicht Electron)');
            }
            
            document.getElementById('status').innerHTML = '🎉 App komplett geladen und funktionsfähig!';
        });
        
        // Klick auf Karte
        document.getElementById('flashcard').addEventListener('click', flipCard);
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    flipCard();
                    log('⌨️ Leertaste: Karte gedreht');
                    break;
                case 't':
                    testBasic();
                    log('⌨️ T: Test gestartet');
                    break;
                case 'c':
                    clearOutput();
                    log('⌨️ C: Output geleert');
                    break;
            }
        });
    </script>
</body>
</html>`;

    // Inline HTML laden (funktioniert IMMER)
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

    // DevTools öffnen
    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        console.log('✅ Fenster ist bereit und wird angezeigt!');
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Debug: Zeige was passiert
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('🎯 HTML erfolgreich geladen!');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ HTML-Load fehlgeschlagen:', errorCode, errorDescription);
    });
}

// App Events
app.whenReady().then(() => {
    console.log('🚀 Electron ist bereit!');
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

console.log('🔧 Main Process Script läuft');
console.log('📱 Electron Version:', process.versions.electron);
console.log('📦 Node Version:', process.versions.node);