import React, { Component } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';
import Player from './Player.js';
import Login from './Login.js';
import Search from './Search.js';
import Mask from './Mask.js';
import { endpoint } from './config.js';


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
      userId: localStorage.getItem('userId'),
      socketId: null,
      isMaster: false,
      activeMemberCount: 0,
      token: null,
      deviceId: null,
      playlist: [],
      songsAhead: 0,
      track: null,
      is_playing: false,
      progress_ms: 0,
      isSearching: false,
      socket: null
    };
    this.handleLogin = this.handleLogin.bind(this);
    this.handleStationState = this.handleStationState.bind(this);
    this.handleClickAdd = this.handleClickAdd.bind(this);
    this.handleAddToQueue = this.handleAddToQueue.bind(this);
    this.closeSearch = this.closeSearch.bind(this);
    this.handleToken = this.handleToken.bind(this);

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
      },
      {
        uri: "spotify:track:2uzA8NPdHuT9IB2xvuME8m",
        artUrl: "https://i.scdn.co/image/ab67616d0000b273a043fb69d8fcf165becfd37a",
        name: "The Bliss Of Now",
        albumName: "Soul Surfers (Remastered 2019)",
        artist: "AstroPilot",
        duration_ms: 471579
      },
      {
        uri: "spotify:track:5kB7rOEuGfEv2ZalHLhTad",
        artUrl: "https://i.scdn.co/image/ab67616d0000b2737e4ed1ead055f2a1bb356fe9",
        name: "Center of the Sun - Solarstone's Chilled Out Remix",
        albumName: "Tears from the Moon / Center of the Sun (Remixes)",
        artist: "Conjure One",
        duration_ms: 598706
      }
    ];
  }

  componentDidMount() {
    // console.log(`endpoint: ${endpoint}`);

    this.socket = socketIOClient(endpoint);
    this.socket.on("connect", () => {
      this.setState({
        socket: this.socket,
        socketId: this.socket.id
      });
    });

    if (this.state.userId === null) {
      let userId = localStorage.getItem('userId');
      if (userId !== null) {
        this.setState({userId: localStorage.getItem('userId')});
      }
    } else {
      this.socket.emit("register", {userId: this.state.userId});
    }

    // this.socket.on("station state",
    //   stationState => this.handleStationState(stationState));

    this.socket.on("token refresh",
        token => this.handleToken(token));
  }

  componentWillUnmount() {
    // Un-socket the socket!
  }

  handleToken(token) {
    console.log(token);
  }

  handleStationState(stationState) {
    // console.log(`got station state:`);
    // console.log(stationState);
    const { is_playing, progress_ms, track, playlist, activeMemberCount } = stationState;
    this.setState({
      activeMemberCount,
      is_playing: is_playing || false,
      progress_ms: progress_ms || 0,
      track: track || null,
      playlist: playlist || []
    });
  }

  closeSearch() {
    this.setState(state => {
      return {
        isSearching: !state.isSearching
      }
    });
  }

  handleClickAdd() {
    this.setState(state => {
      return {
        isSearching: !state.isSearching
      }
    });
  }

  handleAddToQueue(track) {
    // Send to server
    this.socket.emit("add song", track);
  }

  handleLogin(token, deviceId) {
    /*
    Here we have the device selected.
     */
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
      userId,
      token,
      deviceId,
      track,
      progress_ms,
      playlist,
      activeMemberCount,
      isSearching,
      socket
    } = this.state;
    return (
        <Router>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/radio/:userId"
                   render={props => {
                     let {userId} = props.match.params;
                     localStorage.setItem('userId', userId);
                     return(<Redirect to="/" />);
                   }}/>
            <Route path="/">
              {
                userId === null && <Redirect to="/login" />
              }
              <Player
                  track={track}
                  progress_ms={progress_ms}
                  playlist={playlist}
                  onClickAdd={this.handleClickAdd}
                  activeMemberCount={activeMemberCount}
              />
              {this.state.socket !== null &&
              <Search
                  socket={socket}
                  isSearching={isSearching}
                  onClick={this.closeSearch}
                  playlist={playlist}
                  onAddToQueue={this.handleAddToQueue} />
              }
              {token === null && <Mask />}
            </Route>
          </Switch>
        </Router>
    );
  }
}

export default App;
