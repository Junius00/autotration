const { SerialPort, ReadlineParser } = require("serialport");
const { BAUDRATE, FLAG_INIT } = require('../constants/serial');

const initBoard = (path, onBoot, hasBoard = false, baudRate = BAUDRATE) => {
    if (hasBoard) return;

    const board = new SerialPort({ path, baudRate }, (err) => {if (err) {
        console.log(err.message);
        onBoot(null);
    }});

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

    const parser = new ReadlineParser();
    board.pipe(parser);
    parser.on('data', respWrapper);
}
const boardWrite = (board, data) => {
    console.log('Serial writing:', data.toString());
    board.write(data.toString());
}

module.exports = { initBoard, waitResp, boardWrite };