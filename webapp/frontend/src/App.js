import './App.css';
import React from 'react';
import { writeSerial } from './socket';
import { SERIAL_OUT } from './constants/sockets';
import { io } from 'socket.io-client';
import { FLAG_ERROR } from './constants/flags';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      count: 0,
      serial: 'Please start the backend server.'
    };

  }

  componentDidMount() {
    if (this.socket) return;

    this.socket = io.connect('ws://localhost:8888');

    this.socket.on(SERIAL_OUT, (val) => {
      console.log('received', val);
      this.setState({ serial: (val === FLAG_ERROR) ? 'Please check board connecction.' : val });
    });
  }

  render() {
    return (
      <div className="App">
        <p>{this.state.serial}</p>
        <input onChange={(event) => {
          this.setState({ count: parseInt(event.target.value) });
          }}/>
        <button onClick={() => writeSerial(this.socket, this.state.count)}>Send signal</button>
      </div>
    );
  }
}

export default App;
