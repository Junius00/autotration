from sequences import down_until_stop, drop_seq, up_until_stop
from serial_functions import init_serial


def main():
    mega = init_serial()

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

if __name__ == 'main':
    main()