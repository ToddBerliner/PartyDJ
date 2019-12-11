'use strict';

// requires
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const spotify = require("./spotify.js");
const station = require("./station.js");

const playlistData = require("./src/playlistData.js");

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
let heartbeat = null;

// Spotify handlers
const handleGetCurrentlyPlaying = response => {
    // authenticated and have player data
    if (response.status === 200 && response.data !== '') {
        state.is_playing = response.data.is_playing || false;
        state.progress_ms = response.data.progress_ms || 0;
        state.track = spotify.extractTrack(response.data);
    }
}

// Station handlers

// on connection method
io.on("connection", socket => {

    console.log("client connected");
    // set active member count
    state.activeMemberCount = io.engine.clientsCount;
    // initialize user
    const userId = socket.id;
    users[userId] = { playlist: [] }

    console.log(userId);
    console.log(users[userId]);

    console.log(heartbeat);
    heartbeat = setInterval(() => {
        console.log(`emitting state for ${userId}`);
        io.to(`${userId}`).emit("station state", station.getStationState(users[userId], state));
    }, 2000);

    // Handle login
    socket.on("spotify login", data => {
        // set state so heartbeat picks up signal to poll spotify
        spotifyAuth.token = data.token;
        spotifyAuth.deviceId = data.deviceId;
        console.log(`token set: ${spotifyAuth.token}`);
        // start heartbeat
        // TODO: move this when spotify is server authenticated instead of simple auth
        heartbeat = setInterval(() => {
            // check for connected users and tokens
            if (spotifyAuth.token !== null) {
                spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
            }
            console.log(`emitting state`);
            io.emit("station state", station.getStationState(users[userId], state));
        }, 1000);
    });

    // Handle queue add
    socket.on("add song", track => {
        // add track to user's playlist
        users[userId].playlist.push(track);
        console.log(`got track, new count: ${users[userId].playlist.length}`);
        console.log(station.getStationState(users[userId], state));
    });

    // Handle queue remove
    socket.on("remove song", (socket, index) => {
        handleRemoveSong(socket.id, index);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("client disconnected");
        state.activeMemberCount = io.engine.clientsCount;
        delete (users[userId]);
        if (state.activeMemberCount === 0) {
            console.log("clearing hearbeat");
            clearInterval(heartbeat);
            state.active = false;
        }
    });
});

// Listen up!
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});