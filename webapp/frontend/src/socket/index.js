import { FLAG_OK } from "../constants/flags";
import { CONNECT_IN, CONNECT_OUT, DATA_OUT, DATA_REQ, SERIAL_IN, SERIAL_OUT } from "../constants/sockets"

//IN and OUT are with respect to BACKEND SERVER

const setOneTimeListener = (socket, emitOut, onResp) => {
    const listener = (val) => {
        onResp(val);
        socket.off(emitOut, listener);
    }

    socket.on(emitOut, listener);

    return listener;
}

const emitAndListen = (socket, emitIn, emitOut, emitData, onResp = null) => {
    socket.emit(emitIn, emitData);

    if (onResp) {
        return setOneTimeListener(socket, emitOut, onResp);
    }

    return null;
};

const globalsReq = (socket, onData) => {
    emitAndListen(socket, DATA_REQ, DATA_OUT, 'data', onData);
};

const connectReq = (socket, port, onStatus) => {
    emitAndListen(socket, CONNECT_IN, CONNECT_OUT, port, (flag) => onStatus(flag === FLAG_OK));
}

const writeSerial = (socket, data, onResp = null) => {
    return emitAndListen(socket, SERIAL_IN, SERIAL_OUT, data, onResp);
};

const listenSerial = (socket, onData) => {
    return setOneTimeListener(socket, SERIAL_OUT, onData);
};

const cancelSerialListener = (socket, listener) => {
    socket.off(SERIAL_OUT, listener);
};

export { globalsReq, connectReq, writeSerial, listenSerial, cancelSerialListener }