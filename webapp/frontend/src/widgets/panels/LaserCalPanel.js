import React from 'react';
import { FLAG_OK, FLAG_STOP, LASER_CALIBRATION_SEQ } from '../../constants/flags';
import { writeSerial, listenSerial } from '../../socket';
import ButtonState from '../../views/CyclicButton/ButtonState';
import CyclicButton from '../../views/CyclicButton/CyclicButton';
import ValidatedInput from '../../views/ValidatedInput';

const LaserCalPanel = ({ socket, globals, setGlobals, exit }) => {
    const [ volStart, setVolStart ] = React.useState();
    const [ height, setHeight ] = React.useState();

    if (!volStart) return <div>
        <p>Please enter the starting volume.</p>
        <ValidatedInput 
            validator={(val) => {
                try {
                    const numVal = parseFloat(val);
                    return null;
                }
                catch {
                    return 'Please enter a valid number.';
                }
            }}
            setInput={(val) => {
                const numVal = parseFloat(val);
                setVolStart(numVal);
            }}
        />
    </div>;

    //Long drip and ask for stop
    if (!height) {
        const statesDrip = [
            new ButtonState('Start Dripping', (goNext) => {
                writeSerial(socket, LASER_CALIBRATION_SEQ, (flag) => {
                    if (flag === FLAG_OK) goNext();
                });
            }),
            new ButtonState('Stop Dripping', (_) => {
                writeSerial(socket, FLAG_STOP, (flag) => {
                    if (flag !== FLAG_OK) return;
                    
                    listenSerial(socket, (h) => {
                        setHeight(parseFloat(h));
                    });
                });
            }, 'red')
        ];

        return <CyclicButton
            enabled={true}
            states={statesDrip}
        />;
    }

    //Ask for end volume and exit
    return <div>
        <p>Please enter the end volume.</p>
        <ValidatedInput 
            validator={(val) => {
                try {
                    const numVal = parseFloat(val);
                    return null;
                }
                catch {
                    return 'Please enter a valid number.';
                }
            }}
            setInput={(val) => {
                const volEnd = parseFloat(val);

                globals.volStep = (volStart - volEnd) / height;
                setGlobals(globals);
                exit();
            }}
        />
    </div>;
};

export default LaserCalPanel;