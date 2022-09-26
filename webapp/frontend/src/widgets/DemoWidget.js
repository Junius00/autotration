import { Component } from "react";
import { DEMO_SEQ, DP, FLAG_OK, SEP } from "../constants/flags";
import { SERIAL_OUT } from "../constants/sockets";
import { writeSerial } from "../socket";


class DemoWidget extends Component {
    constructor(props) {
        super(props);

        this.socket = props.socket;
        console.log(props);
        this.state = {
            distance: 0
        };

        this.shouldStop = false;
        this.waiting = false;
    }

    writeDemo() {
        if (this.waiting) return;

        this.waiting = true;
        writeSerial(this.socket, DEMO_SEQ, (val) => {
            //distance receiver
            if (val !== FLAG_OK) {
                return;
            }
            
            const onResp = (val) => {
                this.setState({
                    distance: this.state.distance + parseFloat(val.split(SEP)[0])
                });
                
                this.waiting = false;
                if (!this.shouldStop) this.writeDemo();
                this.socket.off(SERIAL_OUT, onResp);
            };
            this.socket.on(SERIAL_OUT, onResp);
        });
    }

    render() {
        return <div style={{
            flexDirection: 'column'
        }}>
            <h1>Volume Titrated:</h1>
            <p style={{
                fontSize: 100
            }}>
                {(this.state.distance * 0.09593246354566386).toFixed(DP)} ml
            </p>
            <button onClick={() => {
                this.shouldStop = false;
                this.writeDemo();
            }}>Start Demo</button>
            <button onClick={() => this.shouldStop = true}>Terminate</button>
        </div>
    }
}

export default DemoWidget;