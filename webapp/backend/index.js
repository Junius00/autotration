const { HTTP_PORT } = require('./constants/server');
const { SERIAL_IN, SERIAL_OUT, CONNECT_IN, CONNECT_OUT, DATA_IN, DATA_REQ } = require('./constants/socket');

//express and socket.io initialisation
const app = require('express')();
const httpServer = require('http').createServer(app);
const { Server } = require('socket.io');
const { initBoard, waitResp } = require('./serial');
const { onSerialIn, onDataIn, onDataReq } = require('./socket');
const { FLAG_OK, FLAG_ERROR } = require('./constants/serial');
const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });

let board, activeSocket;

io.on('connection', (socket) => {
  if (activeSocket) activeSocket.disconnect();
  activeSocket = socket;
  
  console.log('connected socket:', socket.id);
  socket.emit(SERIAL_OUT, `Connected with ID: ${socket.id}`);
  
  //Port connection request
  socket.on(CONNECT_IN, (port) => {
    const onReady = () => initBoard(port, (b) => {
      if (!b) {
        socket.emit(CONNECT_OUT, FLAG_ERROR);
        return;
      }

      board = b;
      socket.emit(CONNECT_OUT, FLAG_OK);

      waitResp(board, (val) => {
        if (activeSocket) activeSocket.emit(SERIAL_OUT, val);
      });
    });

    if (board && board.isOpen) {
      board.close(onReady);
    }
    else onReady();
  });

  //Regular serial data listener
  socket.on(SERIAL_IN, (data) => onSerialIn(socket, board, data));

  //Data listener
  socket.on(DATA_IN, onDataIn);
  socket.on(DATA_REQ, (_) => onDataReq(socket));
  socket.on('disconnect', () => console.log(`${socket.id} has disconnected.`));
});

httpServer.listen(HTTP_PORT, () => {
    console.log(`listening on port ${HTTP_PORT}`);
});