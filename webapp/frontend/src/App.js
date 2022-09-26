import './App.css';
import React from 'react';
import { io } from 'socket.io-client';
import DemoWidget from './widgets/DemoWidget';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      count: 0,
      serial: true
    };

  }

  mountSocket() {
    if (this.socket) return;

    this.socket = io.connect('ws://localhost:8888');

    this.socket.on('disconnect', () => {
      window.open('about:blank', '_self');
      this.setState({ serial: false });
    });
  }

  componentDidMount() {
    this.mountSocket();
  }

  render() {
    if (!this.state.serial) return <p>This app has been disconnected.</p>;
    
    if (!this.socket) this.mountSocket();
    return (
      <div className="App">
        <DemoWidget socket={this.socket} />
      </div>
    );
  }
}

export default App;
