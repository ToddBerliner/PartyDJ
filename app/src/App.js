import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import Player from './Player.js';
import Login from './Login.js';
import { emptyTrack } from './config.js';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

class App extends Component {

  constructor() {
    super();
    this.socket = null;
    this.state = {
      apiHost: window.location.host,
      endpoint: 'http://10.0.0.81:4001',
      userId: null,
      isMaster: false,
      activeMemberCount: 0,
      token: null,
      deviceId: null,
      playlist: [emptyTrack],
      songsAhead: 0,
      track: emptyTrack,
      is_playing: false,
      progress_ms: 0
    }
    this.handleLogin = this.handleLogin.bind(this);
    this.handleStationState = this.handleStationState.bind(this);
  }

  componentDidMount() {
    const { endpoint } = this.state;
    this.socket = socketIOClient(endpoint);
    this.socket.on("station state",
      stationState => this.handleStationState(stationState));
  }

  componentWillUnmount() {
    // Un-socket the socket!
  }

  handleStationState(stationState) {
    console.log('got station state');
    const { is_playing, progress_ms, track } = stationState;
    this.setState({
      is_playing: is_playing || false,
      progress_ms: progress_ms || 0,
      track: track || emptyTrack
    });
    console.log(this.state.is_playing, this.state.progress_ms, this.state.track.duration_ms);
  }

  handleLogin(token, deviceId) {
    this.setState({
      token: token,
      deviceId: deviceId,
      isMaster: true
    }, () => {
      this.socket.emit("spotify login", {
        token: this.state.token,
        deviceId: this.state.deviceId
      });
    });
  }

  render() {
    const {
      redirect,
      token,
      deviceId,
      track,
      progress_ms,
      playlist
    } = this.state;
    if (redirect) {
      return <Redirect to="/login" />
    } else {
      return (
        <Router>
          <Switch>
            <Route path="/login">
              {token && deviceId
                ? <Redirect to="/" />
                : <Login handleLogin={this.handleLogin} />}
            </Route>
            <Route path="/">
              <Player
                track={track}
                progress_ms={progress_ms}
                playlist={playlist}
              />
            </Route>
          </Switch>
        </Router>
      );
    }
  }
}

// /start -> setIsMaster, get token + device id -> go to /master
// /member -> start polling

export default App;
