const { boardWrite } = require("../serial");
const { SERIAL_OUT, DATA_OUT } = require("../constants/socket");
const { FLAG_ERROR } = require("../constants/serial");
const { writeData, readData } = require("../data/rw");

const onDataReq = (socket) => {
    const data = readData();
    console.log(`sending ${data}`);
    socket.emit(DATA_OUT, data);
};

const onDataIn = (data) => {
    console.log(`writing ${data}`);
    writeData(data);
};

const onSerialIn = (socket, board, data) => {
    if (!board) {
        console.log('Board not available yet.');
        socket.emit(SERIAL_OUT, FLAG_ERROR);
        return;
    }

    boardWrite(board, data);
};

module.exports = { 
    onDataIn, onDataReq, 
    onSerialIn 
};