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
    this.handleLogin = this.handleLogin.bind(this);
  }

  componentDidMount() {
    // Set API host based on whatever link was distrubted to members
    this.setState({ apiHost: window.location.host });
  }

  componentWillUnmount() {
    clearInterval(this.poller);
  }

  getStationState() {
    // get station state from server
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
          this.setState({

          })
        }
      }
    });
  }

  handleLogin(token, deviceId) {
    this.setState({
      token: token,
      deviceId: deviceId,
      isMaster: true,
      userId: 0
    }, () => {
      this.poller = setInterval(this.getCurrentlyPlaying, 1000);
    });
  }

  render() {
    const {
      redirect,
      token,
      deviceId,
      item,
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
}

// /start -> setIsMaster, get token + device id -> go to /master
// /member -> start polling

export default App;
