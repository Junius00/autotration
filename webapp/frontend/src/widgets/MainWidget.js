import { useEffect, useState} from 'react';
import { FLAG_DOWN_UNTIL_STOP, FLAG_OK, FLAG_STOP, FLAG_UP_UNTIL_STOP } from '../constants/flags';
import { globalsReq, writeSerial } from '../socket';

import GVars from "../globals/GVars";
import ButtonState from "../views/CyclicButton/ButtonState";
import CyclicButton from "../views/CyclicButton/CyclicButton";
import SquareButton from '../views/SquareButton';
import LaserCalPanel from './panels/LaserCalPanel';
import PHCalPanel from './panels/PHCalPanel';
import { DATA_IN } from '../constants/sockets';
import DripPanel from './panels/DripPanel';
import SpacedRow from '../views/SpacedRow';
import SpacedColumn from '../views/SpacedColumn';
import DemoPanel from './panels/DemoPanel';

const MainWidget = ({ socket }) => {
    //init globals
    const [ globals, setGlobals ] = useState(new GVars(null, null, null));
    useEffect(() => {
        globalsReq(socket, (data) => {
            if (!data) return;
    
            setGlobals(GVars.fromJSON(data));
        });
    }, []);

    const writeGlobals = (g) => {
        socket.emit(DATA_IN, g.toJSON());
    };

    //additional screen
    const [ activityPanel, setActivityPanel ] = useState();
    const exit = () => setActivityPanel();

    const defaultStatusMsg = 'Choose an option.';
    const [ statusMsg, setStatusMsg ] = useState(defaultStatusMsg);
    
    //Button enabling and disabling
    const [ upEnabled, setUpEnabled ] = useState(true);
    const [ lowerEnabled, setLowerEnabled ] = useState(true);
    const [ laserCalEnabled, setLaserCalEnabled ] = useState(true);
    const [ pHCalEnabled, setPHCalEnabled ] = useState(true);
    const [ dripEnabled, setDripEnabled ] = useState(true);
    const [ demoEnabled, setDemoEnabled ] = useState(true);

    const enableAll = () => {
        setUpEnabled(true);
        setLowerEnabled(true);
        setLaserCalEnabled(true);
        setPHCalEnabled(true);
        setDripEnabled(true);
        setDemoEnabled(true);
    };

    const disableAll = () => {
        setUpEnabled(false);
        setLowerEnabled(false);
        setLaserCalEnabled(false);
        setPHCalEnabled(false);
        setDripEnabled(false);
        setDemoEnabled(false);
    };

    const singleEnable = (setEnable) => {
        disableAll();
        setEnable(true);
    } 

    const setSignalStatus = (purpose) => setStatusMsg(`Sending signal to ${purpose}...`);

    const flagCheck = (flag, onSuccess, successFlag = FLAG_OK) => {
        if (flag !== successFlag) {
            setStatusMsg('Command failed. Please try again.');
            return;
        }

        onSuccess();
    }

    //State management
    const statesUp = [
        new ButtonState('Raise Laser', (goNext) => {
            setSignalStatus('raise laser');
            writeSerial(socket, FLAG_UP_UNTIL_STOP, (flag) => flagCheck(flag, () => {
                setStatusMsg('Raising laser, click \'Stop\' to stop.'); 
                singleEnable(setUpEnabled);
                goNext();
            }));
        }),
        new ButtonState('Stop', (goNext) => { 
            setSignalStatus('stop laser');
            writeSerial(socket, FLAG_STOP, (flag) => flagCheck(flag, () => {
                setStatusMsg('Laser stopped.');
                enableAll();
                goNext(); 
            }));
        }, 'red')
    ];
    
    const stateLower = new ButtonState('Lower Laser', (_) => {
        setStatusMsg('Lowering laser until float is met.');
        disableAll();
        writeSerial(socket, FLAG_DOWN_UNTIL_STOP, (_) => {
            enableAll();
            setStatusMsg('Laser has been lowered to position.');
        });
    });

    const statePHCal = new ButtonState('Calibrate pH Probe', (_) => setActivityPanel(
        <PHCalPanel 
            socket={socket}
            globals={globals}
            setGlobals={(newGlobals) => {
                writeGlobals(newGlobals);
                setGlobals(newGlobals);
            }}
            exit={() => {
                exit();
                setStatusMsg(`Calibrated - pH 3: ${globals.pH3}; pH7: ${globals.pH7}`);
            }}
        />
    ));

    const stateLaserCal = new ButtonState('Calibrate Volume to Height Ratio', (_) => setActivityPanel(
        <LaserCalPanel
            socket={socket}
            globals={globals}
            setGlobals={(newGlobals) => {
                writeGlobals(newGlobals);
                setGlobals(newGlobals);
            }}
            exit={() => {
                exit();
                setStatusMsg(`Volume to height ratio has been calibrated to ${globals.volStep.toFixed(5)} ml/mm.`)
            }}
        />
    ));
    
    const stateDrip = new ButtonState('Start Dripping', (_) => {
        if (!globals.valuesComplete()) {
            setStatusMsg('Please calibrate pH AND volume to height ratio before continuing.');
            return;
        }

        setActivityPanel(
            <DripPanel
                socket={socket}
                globals={globals}
            />
        );
    });

    const stateDemo = new ButtonState('Demo Sequence', (_) => {
        if (!globals.volStep) {
            setStatusMsg('Please calibrate volume to height ratio before continuing.');
            return;
        }

        setActivityPanel(
            <DemoPanel
                socket={socket}
                mmToVol={globals.volStep}
            />
        );
    });

    if (activityPanel) return <SpacedColumn>
        {activityPanel}
        <button onClick={() => {
            exit();
            setStatusMsg(defaultStatusMsg);
        }}>Cancel/Exit</button>
    </SpacedColumn>;

    return <SpacedColumn>
        <p>{statusMsg}</p>
        <SpacedRow>
            <CyclicButton 
                enabled={upEnabled}
                states={statesUp} 
            />
            <SquareButton
                enabled={lowerEnabled}
                state={stateLower}
            />
            <SquareButton
                enabled={pHCalEnabled}
                state={statePHCal}
            />
            <SquareButton
                enabled={laserCalEnabled}
                state={stateLaserCal}
            />
            <SquareButton
                enabled={dripEnabled}
                state={stateDrip}
            />
        </SpacedRow>
        <SpacedColumn
            align='stretch'
            spacing={-10}
        >
            <h3>Current Machine Settings</h3>
            <p>Volume to Height Ratio (ml/mm): {globals.volStep ? globals.volStep.toFixed(5) : null}</p>
            <p>pH 4 Analog Value: {globals.pH4}</p>
            <p>pH 7 Analog Value: {globals.pH7}</p>
        </SpacedColumn>
    </SpacedColumn>;
};

export default MainWidget;