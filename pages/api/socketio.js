import { Server as ServerIO } from 'socket.io';

export default async function handler(req, res) {
    if (res.socket.server.io) {
        console.log('Socket is already running');
        res.end();
        return;
    }

    console.log('Setting up socket');
    const io = new ServerIO(res.socket.server, {
        path: '/api/socketio',
        addTrailingSlash: false,
    });

    // Store game state
    let gameState = {
        currentQuestion: "",
        answers: [],
        team1: { points: 0, strikes: 0 },
        team2: { points: 0, strikes: 0 },
        roundPoints: 0,
        buzzerEnabled: false
    };

    let questionsDatabase = [];
    let currentQuestionIndex = 0;

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('joinAsHost', () => {
            console.log('Host joined');
            socket.role = 'host';
            socket.emit('hostConnected');
            socket.emit('gameStateUpdate', gameState);
        });

        socket.on('joinAsDisplay', () => {
            console.log('Display joined');
            socket.role = 'display';
            socket.emit('displayConnected');
            socket.emit('gameStateUpdate', gameState);
        });

        socket.on('joinAsPlayer', (name) => {
            console.log('Player joined:', name);
            socket.playerName = name;
            socket.role = 'player';
            socket.emit('playerConnected', { name });
            io.emit('updatePlayers', Array.from(io.sockets.sockets.values())
                .filter(s => s.role === 'player')
                .map(s => s.playerName));
        });

        socket.on('uploadQuestions', (questions) => {
            if (socket.role === 'host' && Array.isArray(questions)) {
                questionsDatabase = questions;
                currentQuestionIndex = 0;
                gameState.currentQuestion = questions[0].question;
                gameState.answers = questions[0].answers.map(a => ({...a, revealed: false}));
                io.emit('gameStateUpdate', gameState);
                socket.emit('questionsUploaded', { success: true });
            }
        });

        socket.on('gameAction', (action) => {
            if (socket.role === 'host') {
                switch (action.type) {
                    case 'nextQuestion':
                        if (questionsDatabase.length > 0) {
                            currentQuestionIndex = (currentQuestionIndex + 1) % questionsDatabase.length;
                            gameState.currentQuestion = questionsDatabase[currentQuestionIndex].question;
                            gameState.answers = questionsDatabase[currentQuestionIndex].answers.map(a => ({...a, revealed: false}));
                            gameState.buzzerEnabled = false;
                            io.emit('gameStateUpdate', gameState);
                        }
                        break;

                    case 'resetGame':
                        gameState = {
                            currentQuestion: questionsDatabase[0]?.question || "",
                            answers: (questionsDatabase[0]?.answers || []).map(a => ({...a, revealed: false})),
                            team1: { points: 0, strikes: 0 },
                            team2: { points: 0, strikes: 0 },
                            roundPoints: 0,
                            buzzerEnabled: false
                        };
                        currentQuestionIndex = 0;
                        io.emit('gameStateUpdate', gameState);
                        break;

                    case 'toggleBuzzer':
                        gameState.buzzerEnabled = !gameState.buzzerEnabled;
                        io.emit('gameStateUpdate', gameState);
                        break;
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
            if (socket.role === 'player') {
                io.emit('updatePlayers', Array.from(io.sockets.sockets.values())
                    .filter(s => s.role === 'player')
                    .map(s => s.playerName));
            }
        });
    });

    res.socket.server.io = io;
    res.end();
}

export const config = {
    api: {
        bodyParser: false,
    },
};