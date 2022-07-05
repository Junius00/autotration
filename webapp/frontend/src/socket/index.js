import { SERIAL_IN } from "../constants/sockets"

const writeSerial = (socket, data, onResp = null) => {
    console.log('emitting', data);
    socket.emit(SERIAL_IN, data);
}

export { writeSerial }