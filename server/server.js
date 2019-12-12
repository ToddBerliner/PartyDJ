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
    token: "BQDjBMbOFVwp5uggEZZhNdaRP1XD95BgzY313EzLcxu3VDgPO1PJT9ZOgZkCbieGHuFzhIDXrVN86QMAoSzPDsBumYTipsEiF4NQ8-DYlxWSp9GwOt1FkjZgWp8DRTdMnShVlzRa-Ue-KMqapc2g3lLrb1ietABck3PLMfCwrNhG2BzcCGIfGmhUicyVBF3iphNxvE8qzd39i0ZKAYtpKbGBm_4b94YX_GHsvUesF89iaMaUEqAvqsdh1xJJJpAYShC-mDOZsQ",
    deviceId: "bcbab64f626b4a8a5ab39ea45e0603b9c83fae26",
    userId: null
}
let clientHeartbeat = null;
let spotifyHeartbeat = null;

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
    // authenticated and have player data
    if (response.status === 200 && response.data !== '') {
        state.is_playing = response.data.is_playing || false;
        state.progress_ms = response.data.progress_ms || 0;
        state.track = spotify.extractTrack(response.data);

        console.log(`${state.track.name}: ${state.progress_ms} of ${state.track.duration_ms}`);
        if (state.progress_ms > 5000) {
            const nextTrack = station.getNextTrack(users, userMap, state);
            if (nextTrack) {
                console.log(nextTrack.name);
            }
        }
    }
}



// TEMP get next track check
setInterval(() => {
    let nextTrack = station.getNextTrack(users, state);
    if (nextTrack) {
        console.log(`>>> setting track ${nextTrack.name}`);
        // Don't do this - the getCurrentlyPlaying takes care of it

        state.track = nextTrack;
    }
}, 2000);

// Station handlers

// on connection method
io.on("connection", socket => {

    console.log("client connected");

    // set active member count
    state.activeMemberCount = io.engine.clientsCount;
    // initialize user
    const userId = socket.id;
    const tracks = [playlistData.playlist.shift()];
    tracks.push(playlistData.playlist.shift());
    users[userId] = { playlist: tracks }
    usersMap.push(userId);
    updateUsersNext();

    // Handle heartbeat
    if (clientHeartbeat === null) {
        clientHeartbeat = setInterval(() => {
            // console.log('emit');
            io.to(`${userId}`).emit("station state", station.getStationState(users[userId], state));
        }, 1000);
    }

    // Handle login
    socket.on("spotify login", data => {
        // set state so heartbeat picks up signal to poll spotify
        spotifyAuth.token = data.token;
        spotifyAuth.deviceId = data.deviceId;
        spotifyAuth.userId = userId;
        console.log(`token set: ${spotifyAuth.token} for user ${spotifyAuth.userId}`);
        // start spotifyHeartbeat
        // TODO: move this when spotify is server authenticated instead of simple auth
        spotifyHeartbeat = setInterval(() => {
            // check for connected users and tokens
            if (spotifyAuth.token !== null) {
                // console.log(`~~~ spotify gcp ~~~`);
                spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
            }
        }, 1000);
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
        console.log("client disconnected");
        // update member count
        state.activeMemberCount = io.engine.clientsCount;
        // delete user and clear their interval
        delete (users[userId]);
        usersMap.splice(usersMap.indexOf(userId), 1);

        console.log(usersMap);

        clearInterval(clientHeartbeat);
        // clear spotify heartbeat if this is the spotify user
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