const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Create HTTP server for static files
const httpServer = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './family.html';
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.png':
      contentType = 'image/png';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Get local IP address
function getLocalIpAddress() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (!net.internal && net.family === 'IPv4') {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3000;
const HOST = getLocalIpAddress();

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server: httpServer });

let host = null;
let players = [];
let currentTurn = null;

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    switch(data.type) {
      case 'register':
        if (data.role === 'host') {
          host = ws;
          console.log('Host connected');
        } else if (data.role === 'player') {
          if (players.length < 2) {
            players.push({
              ws: ws,
              id: data.playerId,
              name: data.playerName
            });
            console.log(`Player ${data.playerName} connected`);
            
            if (host) {
              host.send(JSON.stringify({
                type: 'playerJoined',
                players: players.map(p => ({ id: p.id, name: p.name }))
              }));
            }
          }
        }
        break;
        
      case 'buzz':
        if (currentTurn === null && players.find(p => p.ws === ws)) {
          currentTurn = players.find(p => p.ws === ws);
          
          if (host) {
            host.send(JSON.stringify({
              type: 'playerBuzzed',
              playerId: currentTurn.id,
              playerName: currentTurn.name
            }));
          }
          
          players.forEach(player => {
            player.ws.send(JSON.stringify({
              type: 'buzzResult',
              winner: currentTurn.id
            }));
          });
        }
        break;
        
      case 'resetBuzz':
        if (ws === host) {
          currentTurn = null;
          players.forEach(player => {
            player.ws.send(JSON.stringify({
              type: 'buzzReset'
            }));
          });
        }
        break;
    }
  });

  ws.on('close', () => {
    if (ws === host) {
      host = null;
      console.log('Host disconnected');
    } else {
      players = players.filter(p => p.ws !== ws);
      console.log('Player disconnected');
      
      if (host) {
        host.send(JSON.stringify({
          type: 'playerLeft',
          players: players.map(p => ({ id: p.id, name: p.name }))
        }));
      }
    }
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
  console.log(`WebSocket server running at ws://${HOST}:${PORT}`);
  console.log('Players should connect to this address in their browsers');
}); 