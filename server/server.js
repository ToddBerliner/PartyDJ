// requires
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const spotify = require("./spotify.js");

// configure server
const port = 4001;
const index = require("./routes/index");

// create express app, init server and bind socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
// use our index.js page
app.use(index);

// Our station state - this should be moved to another file i think
let state = {
    active: false,
    activeMemberCount: 0,
    playlist: [],
    track: null,
    is_playing: null,
    progress_ms: null,
    token: null,
    deviceId: null
}
let users = {};
let spotifyAuth = {
    token: null,
    deviceId: null
}

/*
    connect
        -- add user
    login
        -- set tokens
    heart beat
        -- check for tokens && connected clients, get playing data
        -- emit station state
    disconnect
        -- remove user

    spotify handlers
        handleGetCurrentlyPlaying
            -- update state
            -- play next track
            -- remove tokens if 401
            -- do nothing if 204 / no content
    station handlers
        addQueueSong
        rateSong
*/

// Spotify handlers
const handleGetCurrentlyPlaying = function (response) {
    // authenticated and have player data
    if (response.status === 200 && response.data !== '') {
        state.is_playing = response.data.is_playing || false;
        state.progress_ms = response.data.progress_ms || 0;
        state.track = spotify.extractTrack(response.data);
    }
}

// on connection method
io.on("connection", socket => {

    console.log("client connected");
    state.activeMemberCount = io.engine.clientsCount;

    // Activate heartbeat
    if (!state.active) {
        state.active = true;
        setInterval(() => {
            // check for connected users and tokens
            if (spotifyAuth.token !== null) {
                spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
            }
            io.emit("station state", state);
        }, 1000);
    }

    // Handle login
    socket.on("spotify login", data => {
        // set state so heartbeat picks up signal to poll spotify
        spotifyAuth.token = data.token;
        spotifyAuth.deviceId = data.deviceId;
        // start playlist
        spotify.playPlaylist(spotifyAuth.token, spotifyAuth.deviceId);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("client disconnected");
        state.activeMemberCount = io.engine.clientsCount;
    });
});

// Listen up!
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});