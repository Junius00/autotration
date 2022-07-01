from serial import Serial
import time
from constants import DOWN_UNTIL_STOP, DROP_SEQ, SERIAL_BAUDRATE, SERIAL_COM, SERIAL_OK, SERIAL_STOP, UP_UNTIL_STOP

def write_serial(board, data, wait_resp=True):
    board.write(bytes(data, 'UTF-8'))
    resp = board.readline().decode()

    if not wait_resp:
        return resp
    
    while resp == '':
        resp = board.readline().decode()
        time.sleep(0.05)
    
    return resp

def up_until_stop(board):
    resp = write_serial(board, UP_UNTIL_STOP)
    if resp != SERIAL_OK:
        print('An error has occurred.')
        return

    input('Press Enter to stop going up:')
    write_serial(board, SERIAL_STOP, False)

def down_until_stop(board):
    resp = write_serial(board, DOWN_UNTIL_STOP)
    if resp != SERIAL_OK:
        print('An error has occurred.')
    
def drop_seq(board):
    resp = write_serial(board, DROP_SEQ)
    print(f'Final distance: {resp} mm')

def main():
    mega = Serial(port=SERIAL_COM, baudrate=SERIAL_BAUDRATE, timeout=1)
    time.sleep(3)

    choice_dict = {
        1: up_until_stop,
        2: down_until_stop,
        3: drop_seq
    }

    while True:
        print("""
        1. Up until stop
        2. Drop until stop
        3. Drop Sequence
        4. Exit
        """)
        choice = int(input('Enter a selection >> '))
        
        if choice == 4:
            break
        
        choice_dict[choice](mega)

main()
