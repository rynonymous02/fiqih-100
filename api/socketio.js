import { Server } from 'socket.io';

const ioHandler = (req, res) => {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server, {
            path: '/api/socketio',
            addTrailingSlash: false,
        });

        // Socket.io server-side logic
        io.on('connection', socket => {
            console.log('Client connected');

            socket.on('joinAsHost', () => {
                // Remove any existing hosts
                socket.broadcast.emit('hostDisconnected');
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
                socket.emit('playerConnected', name);
                io.emit('updatePlayers', getPlayersList());
            });

            socket.on('gameState', (state) => {
                if (socket.role === 'host') {
                    socket.broadcast.emit('gameStateUpdate', state);
                }
            });

            socket.on('uploadQuestions', (questions) => {
                if (socket.role === 'host' && Array.isArray(questions)) {
                    // Store questions in memory (you might want to use a database in production)
                    global.questionsDatabase = questions;
                    socket.emit('questionsUploaded', { success: true });
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
                if (socket.role === 'player') {
                    io.emit('updatePlayers', getPlayersList());
                }
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export const config = {
    api: {
        bodyParser: false,
    },
};

export default ioHandler;