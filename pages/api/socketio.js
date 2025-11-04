import { Server } from "socket.io";

// Keep global state so serverless function restarts don't lose data during development
if (!global.gameState) {
    global.gameState = {
        currentQuestion: "",
        answers: [],
        team1: { points: 0, strikes: 0 },
        team2: { points: 0, strikes: 0 },
        roundPoints: 0,
        buzzerEnabled: false,
        activeTeam: null
    };
}

if (!global.questionsDatabase) global.questionsDatabase = [];
if (typeof global.currentQuestionIndex === 'undefined') global.currentQuestionIndex = 0;

const SocketHandler = (req, res) => {
    // If Socket.IO already attached, return immediately
    if (res.socket.server.io) {
        res.end();
        return;
    }

    console.log('Setting up Socket.IO');
    const io = new Server(res.socket.server, {
        path: '/api/socketio',
        addTrailingSlash: false,
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log('Client connected', socket.id);
        // Send current global state
        socket.emit('gameStateUpdate', global.gameState);

        socket.on('joinAsHost', () => {
            socket.role = 'host';
            socket.emit('hostConnected');
        });

        socket.on('joinAsDisplay', () => {
            socket.role = 'display';
            socket.emit('displayConnected');
        });

        socket.on('joinAsPlayer', (name) => {
            socket.playerName = name;
            socket.role = 'player';
            socket.emit('playerConnected', { name });
            io.emit('updatePlayers', Array.from(io.sockets.sockets.values())
                .filter(s => s.role === 'player')
                .map(s => s.playerName));
        });

        socket.on('uploadQuestions', (questions) => {
            if (socket.role === 'host' && Array.isArray(questions)) {
                global.questionsDatabase = questions;
                global.currentQuestionIndex = 0;
                const q = questions[0] || { question: '', answers: [] };
                global.gameState.currentQuestion = q.question;
                global.gameState.answers = (q.answers || []).map(a => ({ ...a, revealed: false }));
                io.emit('gameStateUpdate', global.gameState);
                socket.emit('questionsUploaded', { success: true });
            }
        });

        socket.on('gameAction', (action) => {
            if (socket.role !== 'host') return;
            switch (action.type) {
                case 'nextQuestion': {
                    if (global.questionsDatabase.length === 0) return;
                    global.currentQuestionIndex = (global.currentQuestionIndex + 1) % global.questionsDatabase.length;
                    const nextQ = global.questionsDatabase[global.currentQuestionIndex];
                    // Preserve team points, reset strikes
                    global.gameState.currentQuestion = nextQ.question;
                    global.gameState.answers = (nextQ.answers || []).map(a => ({ ...a, revealed: false }));
                    global.gameState.buzzerEnabled = false;
                    global.gameState.team1.strikes = 0;
                    global.gameState.team2.strikes = 0;
                    io.emit('gameStateUpdate', global.gameState);
                    break;
                }
                case 'resetGame': {
                    const q0 = global.questionsDatabase[0] || { question: '', answers: [] };
                    global.gameState = {
                        currentQuestion: q0.question,
                        answers: (q0.answers || []).map(a => ({ ...a, revealed: false })),
                        team1: { points: 0, strikes: 0 },
                        team2: { points: 0, strikes: 0 },
                        roundPoints: 0,
                        buzzerEnabled: false,
                        activeTeam: null
                    };
                    global.currentQuestionIndex = 0;
                    io.emit('gameStateUpdate', global.gameState);
                    break;
                }
                case 'toggleBuzzer':
                    global.gameState.buzzerEnabled = !global.gameState.buzzerEnabled;
                    io.emit('gameStateUpdate', global.gameState);
                    break;
                case 'revealAnswer': {
                    const idx = action.answerIndex;
                    if (typeof idx === 'number' && global.gameState.answers[idx] && !global.gameState.answers[idx].revealed) {
                        global.gameState.answers[idx].revealed = true;
                        const pts = global.gameState.answers[idx].points || 0;
                        if (global.gameState.activeTeam) {
                            global.gameState[`team${global.gameState.activeTeam}`].points += pts;
                        }
                        io.emit('gameStateUpdate', global.gameState);
                    }
                    break;
                }
            }
        });

        socket.on('disconnect', () => {
            if (socket.role === 'player') {
                io.emit('updatePlayers', Array.from(io.sockets.sockets.values())
                    .filter(s => s.role === 'player')
                    .map(s => s.playerName));
            }
        });
    });

    res.socket.server.io = io;
    res.end();
};

export const config = {
    api: { bodyParser: false }
};

export default SocketHandler;