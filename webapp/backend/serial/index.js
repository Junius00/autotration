const { SerialPort } = require("serialport");
const { PORT, BAUDRATE, FLAG_INIT } = require('../constants/serial');

const initBoard = (onBoot, hasBoard = false, path = PORT, baudRate = BAUDRATE) => {
    if (hasBoard) return;

    const board = new SerialPort({ path, baudRate }, (err) => {if (err) console.log(err.message);});

    const onHandshake = (val) => {
        if (val.toString() != FLAG_INIT) return;
        
        console.log('Handshake with board successful.');
        board.removeListener('data', onHandshake);
        onBoot(board);
    }

    const onOpen = () => {
        board.on('data', onHandshake);
        board.removeListener('open', onOpen);
    }

    board.on('open', onOpen);
}

const waitResp = (board, onResp) => {
    const respWrapper = (val) => {
        val = val.toString().trim();
        console.log('Serial returned:', val);
        onResp(val);
    }

    board.on('data', respWrapper);
}
const boardWrite = (board, data) => {
    console.log('Serial writing:', data.toString());
    board.write(data.toString());
}

module.exports = { initBoard, waitResp, boardWrite };