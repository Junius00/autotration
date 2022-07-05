const { HTTP_PORT } = require('./constants/server');
const { SERIAL_IN, SERIAL_OUT } = require('./constants/socket');

//express and socket.io initialisation
const app = require('express')();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const { initBoard } = require('./serial');
const { onSerialIn } = require('./socket');
const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });

let board;

initBoard((b) => {
    board = b;
});

io.on('connection', (socket) => {
    console.log('connected socket:', socket.id);
    socket.emit(SERIAL_OUT, `Connected with ID: ${socket.id}`);

    socket.on(SERIAL_IN, (data) => onSerialIn(socket, board, data));
    socket.on('disconnect', () => board.close());
});

httpServer.listen(HTTP_PORT, () => {
    console.log(`listening on port ${HTTP_PORT}`);
});