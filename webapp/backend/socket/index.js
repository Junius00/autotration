const { boardWrite } = require("../serial");
const { SERIAL_OUT } = require("../constants/socket");
const { FLAG_ERROR } = require("../constants/serial");

const onSerialIn = (socket, board, data) => {
    if (!board) {
        console.log('Board not available yet.');
        socket.emit(SERIAL_OUT, FLAG_ERROR);
        return;
    }

    const onResp = (valStr) => {
        socket.emit(SERIAL_OUT, valStr);
    }
    boardWrite(board, data, onResp);
}

module.exports = { onSerialIn };