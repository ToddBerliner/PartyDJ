import React, { Component } from 'react';
import * as $ from "jquery";
import './App.css';
import Player from './Player.js';
import Login from './Login.js';
import { emptyItem } from './config.js';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";

class App extends Component {

  constructor() {
    super();
    this.state = {
      apiHost: null,
      userId: null,
      isMaster: false,
      activeMemberCount: 0,
      token: null,
      deviceId: null,
      playlist: [],
      songsAhead: 0,
      item: emptyItem,
      is_playing: "Paused",
      progress_ms: 124560
    }
    this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this);
    this.getStationState = this.getStationState.bind(this);
    this.getMasterStationState = this.getMasterStationState.bind(this);
    this.playAline = this.playAline.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

  componentDidMount() {

    if (this.state.token) {
      this.poller = setInterval(this.getCurrentlyPlaying, 1000);
      this.poller2 = setInterval(this.getMemberStationState, 1000);
    }

    // Set API host based on whatever link was distrubted to members
    this.setState({ apiHost: window.location.host });
  }

  componentWillUnmount() {
    clearInterval(this.poller);
    clearInterval(this.poller2);
  }

  getStationState() {
    if (this.state.isMaster) {
      this.getMasterStationState(this.state.userId, this.state.token);
    } else {
      this.getMemberStationState(this.state.userId);
    }
  }

  getMemberStationState(userId) {
    // if userId === null, station will generate userId and include it in response
    console.log("getting Member Station state");
  }

  getMasterStationState(userId) {
    // if userId === null, station will generate userId and include it in response
    console.log("getting Master Station state");
  }

  getCurrentlyPlaying() {
    // Make a call using the token
    // This gets moved to the server
    $.ajax({
      url: "https://api.spotify.com/v1/me/player",
      type: "GET",
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Authorization", "Bearer " + this.state.token);
      },
      success: function (data) {
        if (data) {
          this.setState({
            item: data.item,
            is_playing: data.is_playing,
            progress_ms: data.progress_ms,
          });
        }
      },
      context: this,
      error: function (xhr, status, error) {
        if (xhr.status === 401) {
          this.setState({ token: null });
          clearInterval(this.poller);
        }
      }
    });
  }

  playAline() {
    // This gets moved to the server
    const aline = {
      context_uri: "spotify:playlist:4HYvgc9ft7dr4uv9SYxVZE"
    }
    $.ajax({
      url: "https://api.spotify.com/v1/me/player/play?device_id=" + this.state.deviceId,
      type: "PUT",
      data: JSON.stringify(aline),
      beforeSend: (xhr) => {
        xhr.setRequestHeader("Authorization", "Bearer " + this.state.token);
      },
      statusCode: {
        200: function () { console.log("200") },
        204: function () { console.log(204) },
        404: function (xhr, status, error) {
          console.log(xhr, status, error);
        }
      }
    });
  }

  handleLogin(token, deviceId) {
    this.setState({
      token: token,
      deviceId: deviceId,
      isMaster: true
    }, () => {
      this.poller = setInterval(this.getCurrentlyPlaying, 1000)
    });
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route path="/login">
            {this.state.token && this.state.deviceId
              ? <Redirect to="/" />
              : <Login handleLogin={this.handleLogin} />}
          </Route>
          <Route path="/">
            <Player
              item={this.state.item}
              progress_ms={this.state.progress_ms}
              playlist={this.state.playlist}
            />
          </Route>
        </Switch>
      </Router>
    );
  }
}

// /start -> setIsMaster, get token + device id -> go to /master
// /member -> start polling

export default App;
