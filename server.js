const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

// Create Express app
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve family.html at /family route
app.get('/family', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'family.html'));
});

// Serve host.html at /host route
app.get('/host', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

// Serve player.html at /player route
app.get('/player', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state with fiqh/thaharah questions
let gameState = {
    currentQuestion: "Sebutkan macam macam najis",
    answers: [
        { text: "Najis Mukhofafah", points: 30 },
        { text: "Najis Mutawasitho", points: 25 },
        { text: "Najis Mughaladah", points: 20 },
        { text: "Najis Ainiyah", points: 15 },
        { text: "Najis Hukmiyah", points: 10 }
    ],
    team1: { points: 0, strikes: 0 },
    team2: { points: 0, strikes: 0 },
    currentRound: 1,
    roundPoints: 0,
    buzzerEnabled: false,
    activeTeam: null
};

// Database pertanyaan fiqh/thaharah
const questionsDatabase = [
    {
        question: "Apa saja alat untuk membersihkan najis",
        answers: [
            { text: "Air", points: 30 },
            { text: "Tanah", points: 25 },
            { text: "Kaki Hingga Mata Kaki", points: 20 },
            { text: "Sebagian Rambut", points: 15 }
        ]
    },
    {
        question: "Apa saja najis mutawasitho?",
        answers: [
            { text: "Kotoran", points: 30 },
            { text: "Air Kencing", points: 25 },
            { text: "Darah", points: 20 },
            { text: "Bangkai", points: 15 },
        ]
    },
    {
        question: "Apa saja penyebab hadast kecil",
        answers: [
            { text: "Buang air kecil/besar", points: 30 },
            { text: "Kentut", points: 25 },
            { text: "Tidur", points: 20 },
            { text: "Mabuk/Pink Sun", points: 15 },
            { text: "Menyentuh #$@$@%", points: 10 },
            { text: "Tidur dengan posisi berbaring", points: 5 }
        ]
    }
];

let currentQuestionIndex = 0;

// Store connected clients
const clients = new Set();
let displayHost = null; // family.html
let gameHost = null;    // host.html
const players = new Set();
let isBuzzActive = false;

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'identify':
                    if (data.role === 'host') {
                        gameHost = ws;
                        console.log('Game Host registered');
                        // Send initial game state
                        ws.send(JSON.stringify({
                            type: 'gameState',
                            state: gameState
                        }));
                    }
                    break;

                case 'register':
                    if (data.role === 'display') {
                        displayHost = ws;
                        console.log('Display Host registered');
                        // Send filtered game state
                        sendFilteredGameState(ws);
                    } else if (data.role === 'player') {
                        players.add(ws);
                        ws.playerName = data.playerName;
                        ws.team = data.team;
                        broadcastPlayers();
                        console.log(`Player ${data.playerName} registered for Team ${data.team}`);
                    }
                    break;

                case 'answer':
                    if (ws === gameHost) {
                        handleAnswer(data);
                        // Send sound trigger to display based on answer correctness
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playSound',
                                sound: data.correct ? 'correct' : 'wrong'
                            }));
                        }
                        
                        // Additional event for wrong answers
                        if (!data.correct && displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'wrong',
                                team: data.team
                            }));
                        }
                    }
                    break;

                case 'buzz':
                    if (players.has(ws) && !isBuzzActive && gameState.buzzerEnabled) {
                        isBuzzActive = true;
                        gameState.activeTeam = ws.team;
                        
                        // Notify game host
                        if (gameHost) {
                            gameHost.send(JSON.stringify({
                                type: 'buzz',
                                playerName: ws.playerName,
                                team: ws.team
                            }));
                        }

                        // Notify display host
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playerBuzzed',
                                playerName: ws.playerName,
                                team: ws.team
                            }));
                        }

                        // Notify all players
                        broadcastToPlayers({
                            type: 'buzzLocked',
                            playerName: ws.playerName,
                            team: ws.team
                        });
                    }
                    break;

                case 'toggleBuzzer':
                    if (ws === gameHost) {
                        gameState.buzzerEnabled = data.enabled;
                        isBuzzActive = false;
                        broadcastGameState();
                        broadcastToPlayers({
                            type: 'buzzerState',
                            enabled: data.enabled
                        });
                    }
                    break;

                case 'switchTeam':
                    if (ws === gameHost) {
                        gameState.activeTeam = data.team;
                        broadcastGameState();
                    }
                    break;

                case 'nextQuestion':
                    if (ws === gameHost) {
                        // Move to next question index
                        currentQuestionIndex = (currentQuestionIndex + 1) % questionsDatabase.length;
                        
                        // Create new game state with next question but preserve scores
                        gameState = {
                            currentQuestion: questionsDatabase[currentQuestionIndex].question,
                            answers: questionsDatabase[currentQuestionIndex].answers.map(a => ({...a, revealed: false})),
                            team1: { ...gameState.team1 },
                            team2: { ...gameState.team2 },
                            currentRound: gameState.currentRound + 1,
                            roundPoints: 0,
                            buzzerEnabled: false,
                            activeTeam: null
                        };
                        
                        // Reset game control flags
                        isBuzzActive = false;
                        
                        // Send reset notification and play sound
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playSound',
                                sound: 'start'
                            }));
                        }
                        
                        // Broadcast new state to all clients
                        broadcastGameState();
                    }
                    break;

                case 'resetRound':
                    if (ws === gameHost) {
                        resetRound(data.resetAll);
                    }
                    break;

                case 'showAllAnswers':
                    if (ws === gameHost) {
                        showAllAnswers();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
        if (ws === displayHost) {
            displayHost = null;
            console.log('Display Host disconnected');
        }
        if (ws === gameHost) {
            gameHost = null;
            console.log('Game Host disconnected');
        }
        if (players.has(ws)) {
            players.delete(ws);
            broadcastPlayers();
            console.log(`Player ${ws.playerName} disconnected`);
        }
    });
});

function handleAnswer(data) {
    // Special case for wrong answer (index = -1)
    if (data.index === -1 && !data.correct) {
        // Add strike to the active team
        if (gameState.activeTeam === '1') {
            gameState.team1.strikes++;
        } else if (gameState.activeTeam === '2') {
            gameState.team2.strikes++;
        }
        
        // Send wrong answer event to family.html
        if (displayHost) {
            displayHost.send(JSON.stringify({
                type: 'answer',
                correct: false,
                team: gameState.activeTeam
            }));
        }
        
        // Force immediate state update
        broadcastGameState();
        return;
    }

    // Normal case for revealing answers
    const answer = gameState.answers[data.index];
    if (answer && !answer.revealed) {
        answer.revealed = true;
        answer.correct = data.correct;  // Track if answer was correct
        if (data.correct) {
            // Add points to the active team
            if (gameState.activeTeam === '1') {
                gameState.team1.points += answer.points;
            } else if (gameState.activeTeam === '2') {
                gameState.team2.points += answer.points;
            }
            gameState.roundPoints += answer.points;
        } else {
            // Add strike to the active team
            if (gameState.activeTeam === '1') {
                gameState.team1.strikes++;
            } else if (gameState.activeTeam === '2') {
                gameState.team2.strikes++;
            }
            
            // Send wrong answer event to family.html
            if (displayHost) {
                displayHost.send(JSON.stringify({
                    type: 'answer',
                    correct: false,
                    team: gameState.activeTeam
                }));
            }
        }
        // Force immediate state update
        broadcastGameState();
    }
}

function resetRound(resetAll = true) {
    // Move to next question index
    currentQuestionIndex = (currentQuestionIndex + 1) % questionsDatabase.length;
    
    // Create fresh game state with next question
    gameState = {
        currentQuestion: questionsDatabase[currentQuestionIndex].question,
        answers: questionsDatabase[currentQuestionIndex].answers.map(a => ({...a, revealed: false})),
        team1: resetAll ? { points: 0, strikes: 0 } : { ...gameState.team1 },
        team2: resetAll ? { points: 0, strikes: 0 } : { ...gameState.team2 },
        currentRound: gameState.currentRound + 1,
        roundPoints: 0,
        buzzerEnabled: false,
        activeTeam: null
    };
    
    // Reset game control flags
    isBuzzActive = false;
    
    // Send reset notification and play sound
    if (displayHost) {
        displayHost.send(JSON.stringify({
            type: 'playSound',
            sound: 'start'
        }));
    }
    
    // Force update all clients with the new state
    if (gameHost) {
        gameHost.send(JSON.stringify({
            type: 'forceReset',
            state: gameState
        }));
    }
    
    // Broadcast to other clients
    broadcastGameState();
    broadcastToPlayers({ 
        type: 'roundReset',
        resetAll: resetAll
    });
}

function showAllAnswers() {
    gameState.answers.forEach(answer => answer.revealed = true);
    broadcastGameState();
}

function sendFilteredGameState(ws) {
    // Send a filtered version of game state to the display host
    const displayState = {
        ...gameState,
        answers: gameState.answers.map(a => ({
            ...a,
            text: (a.revealed && a.correct) ? a.text : '',
            points: (a.revealed && a.correct) ? a.points : ''
        }))
    };
    ws.send(JSON.stringify({
        type: 'gameState',
        state: displayState
    }));
}

function broadcastGameState() {
    // Send full state to game host
    if (gameHost) {
        gameHost.send(JSON.stringify({
            type: 'gameState',
            state: gameState
        }));
    }
    // Send filtered state to display host
    if (displayHost) {
        sendFilteredGameState(displayHost);
    }
}

function broadcastPlayers() {
    if (displayHost) {
        const playersList = Array.from(players).map(player => ({
            name: player.playerName,
            team: player.team
        }));
        displayHost.send(JSON.stringify({
            type: 'playerJoined',
            players: playersList
        }));
    }
}

function broadcastToPlayers(data) {
    players.forEach(player => {
        player.send(JSON.stringify(data));
    });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Family display: http://localhost:${PORT}/family`);
    console.log(`Host interface: http://localhost:${PORT}/host`);
    console.log(`Player interface: http://localhost:${PORT}/player`);
});