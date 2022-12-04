import { Component } from "react";
import { DEMO_SEQ, DP, FLAG_OK, SEP } from "../../constants/flags";
import { cancelSerialListener, listenSerial, writeSerial } from "../../socket";


class DemoPanel extends Component {
    constructor(props) {
        super(props);

        this.socket = props.socket;
        this.mmToVol = props.mmToVol;

        this.listener = null;

        this.state = {
            distance: 0
        };

        this.shouldStop = false;
        this.waiting = false;
    }

    writeDemo() {
        if (this.waiting) return;

        this.waiting = true;
        this.listener = writeSerial(this.socket, DEMO_SEQ, (val) => {
            //distance receiver
            if (val !== FLAG_OK) {
                this.listener = null;
                return;
            }
            
            this.listener = listenSerial(this.socket, (val) => {
                this.setState({
                    distance: this.state.distance + parseFloat(val.split(SEP)[0])
                });
                
                this.waiting = false;
                if (!this.shouldStop) this.writeDemo();
            });
        });
    }

    componentWillUnmount() {
        if (this.listener !== null) cancelSerialListener(this.socket, this.listener);
    }

    render() {
        return <div style={{
            flexDirection: 'column'
        }}>
            <h1>Volume Titrated:</h1>
            <p style={{
                fontSize: 100
            }}>
                {(this.state.distance * this.mmToVol).toFixed(DP)} ml
            </p>
            <button onClick={() => {
                this.shouldStop = false;
                this.writeDemo();
            }}>Start Demo</button>
            <button onClick={() => this.shouldStop = true}>Terminate</button>
        </div>
    }
}

export default DemoPanel;