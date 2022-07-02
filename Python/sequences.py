from serial_functions import write_serial
from constants import CALIBRATION_SEQ, CALIBRATION_STEP, DOWN_UNTIL_STOP, DROP_SEQ, SERIAL_OK, SERIAL_STOP, UP_UNTIL_STOP

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

def calibration_seq(board):
    resp = write_serial(board, CALIBRATION_SEQ)
    s = int(resp)

    vol = CALIBRATION_STEP * s
    input(f"Please ensure that at least {vol}mL of liquid is present in the burette, then hit Enter to continue...")

    total = 0
    for i in range(s):
        input(f'{i+1}/{s}: Please release {CALIBRATION_STEP}mL of liquid, then press Enter...')
        total += float(write_serial(board, SERIAL_OK))
    
    print(f'mL/mm: {vol / total}')        

def drop_seq(board):
    resp = write_serial(board, DROP_SEQ)
    print(f'Final distance: {resp} mm')
