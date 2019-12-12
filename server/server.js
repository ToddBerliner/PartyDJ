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
    activeMemberCount: 0,
    playlist: [],
    track: null,
    is_playing: null,
    progress_ms: null,
    currentUserId: null
}
let users = {};
let usersMap = [];
let spotifyAuth = {
    token: null,
    deviceId: null,
    userId: null
}

// Spotify heartbeat
let spotifyHeartbeat = setInterval(() => {
    if (spotifyAuth.token !== null && spotifyAuth.deviceId !== null) {
        spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
    }
}, 2000);

const updateUsersNext = () => {
    for (const [index, userId] of usersMap.entries()) {
        if (index === usersMap.length - 1) {
            users[userId].next = usersMap[0];
        } else {
            users[userId].next = usersMap[index + 1];
        }
    }
}

// Spotify handlers
const handleGetCurrentlyPlaying = response => {

    console.log(response.status);

    // authenticated and have player data
    if (response.status === 200 && response.data !== '') {
        state.is_playing = response.data.is_playing || false;
        state.progress_ms = response.data.progress_ms || 0;
        state.track = (spotify.extractTrack(response.data))
            ? spotify.extractTrack(response.data)
            : null;

        console.log(`${state.is_playing}: ${state.progress_ms} of ${state.track.duration_ms}`);

        if (state.is_playing && state.progress_ms > state.track.duration_ms) {
            console.log("Next!");
            const nextTrack = station.getNextTrack(users, state);
            console.log(nextTrack);
            if (nextTrack) {
                console.log(nextTrack.name);
            }
        }
    }
}



// TEMP start spotify


// Station handlers

// on connection method
io.on("connection", socket => {

    console.log(`Client connected: ${socket.id}`);

    // Set active member count
    state.activeMemberCount = io.engine.clientsCount;

    // Initialize user
    const userId = socket.id;
    users[userId] = { playlist: [], emitter: null }
    usersMap.push(userId);
    updateUsersNext();

    // Handle heartbeat
    users[userId].emitter = setInterval(() => {
        // console.log(`--> emit to: ${userId}`);
        io.to(`${userId}`).emit("station state", station.getStationState(users[userId], state));
    }, 1000);

    // Handle login
    socket.on("spotify login", data => {
        // set state so heartbeat picks up signal to poll spotify
        spotifyAuth.token = data.token;
        spotifyAuth.deviceId = data.deviceId;
        spotifyAuth.userId = userId;
        console.log(`token set: ${spotifyAuth.token} for user ${spotifyAuth.userId}`);
    });

    // Handle queue add
    socket.on("add song", track => {
        // add track to user's playlist
        users[userId].playlist.push(track);
    });

    // Handle queue remove
    socket.on("remove song", (socket, index) => {
        handleRemoveSong(socket.id, index);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${userId}`);
        // Update member count
        state.activeMemberCount = io.engine.clientsCount;
        // Clear the user's interval and delete them
        clearInterval(users[userId].emitter);
        delete (users[userId]);
        usersMap.splice(usersMap.indexOf(userId), 1);
        // Update the users map
        updateUsersNext();
        // Clear spotify heartbeat if this is the spotify user
        if (userId === spotifyAuth.userId) {
            clearInterval(spotifyHeartbeat);
            state.track = null;
        }
    });
});

// Listen up!
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});