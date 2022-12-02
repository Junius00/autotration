import React from 'react';
import { DP, DROP_SEQ, FLAG_OK, SEP } from '../../constants/flags';
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
        
        this.dripping = false;
        this.state = {
            shouldDrip: true,
            dripFlag: DROP_SEQ,
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
                const val = new Value(
                    newVol,
                    this.globals.calcPH(parseFloat(analogStr))
                );
                
                const values = this.state.values;
                values.push(val);
                
                this.dripping = false;
                this.setState({ 
                    currentVol: newVol,
                    values: values 
                });
            });
        })
    }

    render() {
        if (this.state.shouldDrip) this.drip();

        return <div>
            <h1>In Drip Sequence</h1>
            <p>Current volume added: {this.state.currentVol.toFixed(DP)} ml</p>
            <button onClick={() => {
                this.setState({ shouldDrip: !this.state.shouldDrip });
            }}>{this.state.shouldDrip ? 'Pause' : 'Continue'} Dripping</button>
            <h2>Titration Values</h2>
            {this.state.values.length > 0 
                ? <HighchartsReact highcharts={Highcharts} options={getOptions(this.state.values)} />
                : <p>No values yet.</p>
            }
        </div>
    }
}

export default DripPanel;