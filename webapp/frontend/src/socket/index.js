import { SERIAL_IN, SERIAL_OUT } from "../constants/sockets"

const writeSerial = (socket, data, onResp = null) => {
    socket.emit(SERIAL_IN, data);

    if (onResp) {
        const listener = (val) => {
            onResp(val);
            socket.off(SERIAL_OUT, listener);
        };

        socket.on(SERIAL_OUT, listener);
    }
}

export { writeSerial }