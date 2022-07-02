from serial_functions import write_serial
from constants import DOWN_UNTIL_STOP, DROP_SEQ, SERIAL_OK, SERIAL_STOP, UP_UNTIL_STOP

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
