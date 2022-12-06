import React, { useEffect } from 'react';
import { FLAG_OK, FLAG_STOP, PH_CALIBRATION_SEQ } from '../../constants/flags';
import { cancelSerialListener, listenSerial, writeSerial } from '../../socket';
import ButtonState from '../../views/CyclicButton/ButtonState';
import CyclicButton from '../../views/CyclicButton/CyclicButton';

const PHCalPanel = ({ socket, globals, setGlobals, exit }) => {
    const [ statusMsg, setStatusMsg ] = React.useState('Insert the probe into the pH 4 buffer, then measure.');
    const [ pH4, setPH4 ] = React.useState();

    let activeListener = null;

    React.useEffect(() => () => {
        if (activeListener) cancelSerialListener(socket, activeListener);
    }, []);
    const getPH = (onPH) => {
        setStatusMsg('Sending pH measurement request...');

        activeListener = writeSerial(socket, PH_CALIBRATION_SEQ, (flag) => {
            if (flag !== FLAG_OK) {
                activeListener = null;
                setStatusMsg('Request failed. Please try again.');
                return;
            }
            
            setStatusMsg('Measuring analog value...');
            activeListener = listenSerial(socket, (data) => {
                onPH(parseFloat(data));
                activeListener = null;
            });
        });
    };

    const statesPH = [
        new ButtonState('Measure pH 4 Buffer', (goNext) => {
            getPH((pH) => {
                setPH4(pH);
                setStatusMsg(`pH 4 has an analog value of ${pH}. Please change to the pH 7 buffer, then measure.`);
                goNext();
            });
        }),
        new ButtonState('Measure pH 7 Buffer', (_) => {
            getPH((pH) => {
                globals.pH4 = pH4;
                globals.pH7 = pH;
                setGlobals(globals);

                writeSerial(socket, FLAG_STOP);
                exit();
            })
        })
    ];

    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}
    >
        <p>{statusMsg}</p>
        <CyclicButton 
            enabled={true}
            states={statesPH}
        />
    </div>;
    
};

export default PHCalPanel;