from constants import SERIAL_BAUDRATE, SERIAL_COM
from serial import Serial
import time

def init_serial():
    board = Serial(port=SERIAL_COM, baudrate=SERIAL_BAUDRATE, timeout=1)
    time.sleep(3)

    return board

def wait_for_resp(board):
    resp = board.readline().decode()
    
    while resp == '':
        resp = board.readline().decode()
        time.sleep(0.05)

    return resp

def write_serial(board, data, wait_resp=True):
    board.write(bytes(data, 'UTF-8'))
    resp = board.readline().decode()

    if not wait_resp:
        return resp
    
    return wait_for_resp(board)