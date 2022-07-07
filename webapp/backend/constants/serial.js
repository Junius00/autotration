const PORT = 'COM3';
const BAUDRATE = 115200;

const FLAG_INIT = '69';
const FLAG_OK = '200';
const FLAG_STOP = '201';
const FLAG_ERROR = '404';

const FLAG_UP_UNTIL_STOP = '101';
const FLAG_DOWN_UNTIL_STOP = '102';
const CALIBRATION_SEQ = '103';
const DROP_SEQ = '104';

module.exports = {
    PORT, BAUDRATE,
    FLAG_INIT, FLAG_OK, FLAG_STOP, FLAG_ERROR,
    FLAG_UP_UNTIL_STOP, FLAG_DOWN_UNTIL_STOP, CALIBRATION_SEQ, DROP_SEQ
}