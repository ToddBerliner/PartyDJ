import React, { Component } from 'react';
import * as $ from "jquery";
import Player from './Player.js';
import {
  authEndpoint,
  clientId,
  redirectUri,
  scopes,
  deviceId
} from './config.js';
import './App.css';

const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});

window.location.hash = "";

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
      item: {
        album: {
          images: [{ url: "" }],
          name: ""
        },
        name: "",
        artists: [{ name: "" }],
        duration_ms: 0,
      },
      is_playing: "Paused",
      progress_ms: 124560
    }
    this.getCurrentlyPlaying = this.getCurrentlyPlaying.bind(this);
    this.getStationState = this.getStationState.bind(this);
    this.getMasterStationState = this.getMasterStationState.bind(this);
    this.playAline = this.playAline.bind(this);
  }

  componentDidMount() {

    // Check for master
    if (hash.start) {
      this.setState({ isMaster: true });
    }

    // Check for Spotify token
    let _token = hash.access_token;
    if (_token) {
      this.setState({
        token: _token,
      }, () => { console.log(this.state) });
      this.poller = setInterval(this.getCurrentlyPlaying, 1000);
      this.poller2 = setInterval(this.getMemberStationState, 1000);
    }
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
      url: "https://api.spotify.com/v1/me/player/play?device_id=" + deviceId,
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

  render() {
    return (
      <div className="App">
        {this.state.isMaster && (!this.state.token || !this.state.deviceId) && (
          !this.state.token && (
            <div className="LoginWrap">
              <a
                className="btn btn--loginApp-link"
                href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
              >
                Login to Spotify
            </a>
            </div>
          )
        )}
        {((this.state.isMaster && this.state.token) || !this.state.is_master) && (
          <Player
            item={this.state.item}
            progress_ms={this.state.progress_ms}
            playlist={this.state.playlist}
          />
        )}
      </div>
    );
  }
}

export default App;
