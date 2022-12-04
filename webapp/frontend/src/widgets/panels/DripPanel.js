import React from 'react';
import { DP, DROP_SEQ, FLAG_OK, LONG_DRIP_SEQ, SEP } from '../../constants/flags';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { cancelSerialListener, listenSerial, writeSerial } from '../../socket';

class Value {
    constructor(vol, pH) {
        this.vol = vol;
        this.pH = pH;
    }

    getPoint() {
        return {
            x: this.vol,
            y: this.pH
        }
    }

    calcGradient(lastValue) {
        return (this.pH - lastValue.pH) / (this.vol - lastValue.vol);
    }
}

const getOptions = (values) => {
    return {
        chart: {
            height: 400
        },
        title: {
            text: 'Titrated Graph'
        },
        legend: { enabled: false },
        series: [
            {
                type: 'scatter',
                name: 'Points',
                data: values.map((val) => val.getPoint())
            }
        ]
    }
};

class DripPanel extends React.Component {
    constructor(props) {
        super(props);

        const { socket, globals } = props;
        this.socket = socket;
        this.listener = null;

        this.globals = globals;
        
        //DRIP MODE SWITCHING PARAMETERS
        this.thresholdPreEqPH = 1;
        this.thresholdPostEqPH = 0.2;
        this.thresholdGradient = 1;

        this.dripping = false;
        this.state = {
            shouldDrip: true,
            dripFlag: LONG_DRIP_SEQ,
            currentVol: 0,
            values: []
        }
    }

    componentDidMount() {
        this.drip();
    }

    componentWillUnmount() {
        if (this.listener) cancelSerialListener(this.socket, this.listener);
    }

    nextDripFlag(values, currentDrip) {
        if (values.length <= 1) return currentDrip;

        const lastI = values.length - 1;
        const val1 = values[lastI - 1], val2 = values[lastI];

        const pHDiff = val2.pH - val1.pH;
        const grad = val2.calcGradient(val1);

        let newDrip = currentDrip;

        if (
            ((val2.pH < 7 && currentDrip == LONG_DRIP_SEQ) && (pHDiff >= this.thresholdPreEqPH || grad >= this.thresholdGradient)) ||
            ((val2.pH > 7 && currentDrip == DROP_SEQ) && (pHDiff >= this.thresholdPostEqPH || grad >= this.thresholdGradient))
        ) {
            newDrip = (currentDrip == DROP_SEQ) ? LONG_DRIP_SEQ : DROP_SEQ;
        }

        return newDrip;
    }

    drip() {
        if (this.dripping) return;

        this.dripping = true;
        this.listener = writeSerial(this.socket, this.state.dripFlag, (flag) => {
            this.listener = null;
            if (flag !== FLAG_OK) {
                this.dripping = false;
                return;
            }

            this.listener = listenSerial(this.socket, (dataStr) => {
                this.listener = null;

                const [ heightStr, analogStr ] = dataStr.split(SEP);
                const newVol = this.state.currentVol + this.globals.calcVol(parseFloat(heightStr));
                const newPH = this.globals.calcPH(parseFloat(analogStr));
                const val = new Value(newVol, newPH);
                
                const values = this.state.values;
                values.push(val);
                
                this.dripping = false;
                this.setState({ 
                    currentVol: newVol,
                    values: values,
                    dripFlag: this.nextDripFlag(values, this.state.dripFlag)
                });
            });
        })
    }

    render() {
        if (this.state.shouldDrip) this.drip();

        return <div>
            <h1>In Drip Sequence</h1>
            <p>Currently dispensing {this.state.dripFlag == DROP_SEQ ? 'drip by drip' : 'in long drips'}.</p>
            <p>Current volume added: {this.state.currentVol.toFixed(DP)} ml</p>
            <button onClick={() => {
                this.setState({ shouldDrip: !this.state.shouldDrip });
            }}>{this.state.shouldDrip ? 'Pause' : 'Continue'} Dripping</button>
            <h2>Titration Values</h2>
            {this.state.values.length > 0 
                ? <HighchartsReact highcharts={Highcharts} options={getOptions(this.state.values)} />
                : <p>No values yet.</p>
            }
        </div>;
    }
}

export default DripPanel;