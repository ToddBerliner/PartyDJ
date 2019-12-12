import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import Player from './Player.js';
import Login from './Login.js';
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
      endpoint: 'http://localhost:4001',
      userId: null,
      isMaster: false,
      activeMemberCount: 0,
      token: null,
      deviceId: null,
      playlist: [],
      songsAhead: 0,
      track: null,
      is_playing: false,
      progress_ms: 0
    }
    this.handleLogin = this.handleLogin.bind(this);
    this.handleStationState = this.handleStationState.bind(this);
    this.handleQueueAdd = this.handleQueueAdd.bind(this);
    this.tracks = [
      {
        uri: "spotify:track:49yNhtVHCnmBomxm1kWssH",
        artUrl: "https://i.scdn.co/image/0f4787c1d7f9a100f5c7dac1a40fa6851904935d",
        name: "Sourcebook",
        albumName: "Undiscovered Stories",
        artist: "Solar Fields",
        duration_ms: 944000
      },
      {
        uri: "spotify:track:6HJH2v5BIqpKW34nsLV1O7",
        artUrl: "https://i.scdn.co/image/ab67616d0000b273e934e0ebcd24cd76aa0b3f57",
        name: "The Queen of All Everything",
        albumName: "Skylon",
        artist: "Ott",
        duration_ms: 472400
      },
      {
        uri: "spotify:track:65nZn05blTG4LTSrrHWc3I",
        artUrl: "https://i.scdn.co/image/ab67616d0000b2736a11b91530e776310e3d7544",
        name: "Murmuration",
        albumName: "Murmuration",
        artist: "Audioglider",
        duration_ms: 578359
      },
      {
        uri: "spotify:track:2VD2AthBaeEDWBRhHm136i",
        artUrl: "https://i.scdn.co/image/ab67616d0000b2733d9cfd1fb2191b905645e14c",
        name: "Odysseus Under The Old Tree",
        albumName: "When The Silence Is Speaking",
        artist: "Koan",
        duration_ms: 554306
      }
    ];
  }

  componentDidMount() {
    const { endpoint } = this.state;
    this.socket = socketIOClient(endpoint);
    this.socket.on("connect", () => {
      this.setState({ userId: this.socket.id });
    });
    this.socket.on("station state",
      stationState => this.handleStationState(stationState));
  }

  componentWillUnmount() {
    // Un-socket the socket!
  }

  handleStationState(stationState) {
    console.log(`got station state:`);
    console.log(stationState);
    const { is_playing, progress_ms, track, playlist } = stationState;
    this.setState({
      is_playing: is_playing || false,
      progress_ms: progress_ms || 0,
      track: track || null,
      playlist: playlist || []
    });
  }

  handleQueueAdd() {
    if (this.tracks.length > 0) {
      // Update the local state
      const trackToAdd = this.tracks.shift();
      // this.setState(state => {
      //   return {
      //     playlist: [...state.playlist, trackToAdd]
      //   }
      // });
      // Send to server
      this.socket.emit("add song", trackToAdd);
    }
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
                onQueueAdd={this.handleQueueAdd}
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
