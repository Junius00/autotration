import './App.css';
import React from 'react';
import { io } from 'socket.io-client';
import MainWidget from './widgets/MainWidget';
import ConnectWidget from './widgets/ConnectWidget';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      count: 0,
      isActive: true,
      boardReady: true
    };

  }

  mountSocket() {
    if (this.socket) return;

    this.socket = io.connect('ws://localhost:8888');

    
    this.socket.on('disconnect', () => {
      window.open('about:blank', '_self');
      this.setState({ isActive: false });
    });
  }

  componentDidMount() {
    this.mountSocket();
  }

  render() {
    if (!this.state.isActive) return <p>This app has been disconnected.</p>;
    
    if (!this.socket) this.mountSocket();

    const body = (this.state.boardReady)
      ? <MainWidget socket={this.socket} /> 
      : <ConnectWidget 
        socket={this.socket}
        setBoardReady={(val) => this.setState({ boardReady: val })} 
      />;


    return (
      <div className="App"
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {body}
      </div>
    );
  }
}

export default App;
