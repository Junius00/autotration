import React from 'react';
import { FLAG_OK, PH_CALIBRATION_SEQ } from '../../constants/flags';
import { listenSerial, writeSerial } from '../../socket';
import ButtonState from '../../views/CyclicButton/ButtonState';
import CyclicButton from '../../views/CyclicButton/CyclicButton';

const PHCalPanel = ({ socket, globals, setGlobals, exit }) => {
    const [ statusMsg, setStatusMsg ] = React.useState('Insert the probe into the pH 4 buffer, then measure.');
    const [ pH4, setPH4 ] = React.useState();
    

    const getPH = (onPH) => {
        setStatusMsg('Sending pH measurement request...');

        writeSerial(socket, PH_CALIBRATION_SEQ, (flag) => {
            if (flag !== FLAG_OK) {
                setStatusMsg('Request failed. Please try again.');
                return;
            }
            
            setStatusMsg('Measuring analog value...');
            listenSerial(socket, (data) => onPH(parseFloat(data)));
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