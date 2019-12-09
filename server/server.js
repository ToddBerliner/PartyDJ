'use strict';

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
let users = {
    'a': {
        trackUris: [
            "spotify:track:49yNhtVHCnmBomxm1kWssH", // sourcebook
            "spotify:track:6HJH2v5BIqpKW34nsLV1O7" // queen
        ]
    },
    'b': {
        trackUris: [
            "spotify:track:65nZn05blTG4LTSrrHWc3I", // murmuration
            "spotify:track:2VD2AthBaeEDWBRhHm136i" // odysseus
        ]
    }
};
let spotifyAuth = {
    token: null,
    deviceId: null
}
let heartbeat = null;

/*
    connect
        -- add user
    login
        -- set tokens
        -- start playlist
    heart beat
        -- check for tokens && connected clients, get playing data
        -- emit station state
    disconnect
        -- remove user

    spotify handlers
        handleGetCurrentlyPlaying
            -- update state
    station handlers
        addQueueSong
            -- update playlist
        rateSong
            -- potentially play next
*/

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
const handleAddSong = (userId, trackData) => {

    // Add to correct user
    users[userId].trackUris.push(trackData.uri);

    // Calculate station

    // Update playlist in spotify

}

// on connection method
io.on("connection", socket => {

    console.log("client connected");
    state.activeMemberCount = io.engine.clientsCount;
    users[socket.id] = { trackUris: [] }

    // Handle login
    socket.on("spotify login", data => {
        // set state so heartbeat picks up signal to poll spotify
        spotifyAuth.token = data.token;
        spotifyAuth.deviceId = data.deviceId;
        console.log(`token set: ${spotifyAuth.token}`);
        // start playlist
        spotify.playPlaylist(spotifyAuth.token, spotifyAuth.deviceId);
        // start heartbeat
        // TODO: move this when spotify is server authenticated instead of simple auth
        heartbeat = setInterval(() => {
            // check for connected users and tokens
            if (spotifyAuth.token !== null) {
                spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
                console.log(`emitting state`);
                // TODO: change this emit to be socket specific
                io.emit("station state", state);
            }
        }, 1000);
    });

    // Handle queue add
    socket.on("add song", data => {
        console.log(socket.id);
        handleAddSong(socket.id, data);
    });

    socket.on("remove song", (socket, index) => {
        handleRemoveSong(socket.id, index);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("client disconnected");
        state.activeMemberCount = io.engine.clientsCount;
        delete (users[socket.id]);
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