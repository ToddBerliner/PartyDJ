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
const state = {
    activeMemberCount: 0,
    playlist: [],
    track: null,
    is_playing: null,
    progress_ms: null,
    currentUserId: null
}
const users = {};
const intervals = {};
const usersMap = [];
const spotifyAuth = {
    token: null,
    deviceId: null,
    userId: null,
    playlistId: "40A1SdohDLvoG4iitBuqns",
    playlistUri: "spotify:playlist:40A1SdohDLvoG4iitBuqns"
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

const handleNewTracks = () => {
    // get new playlist
    const _users = JSON.parse(JSON.stringify(users));
    const trackUris = station.getPlaylist(_users);
    // TODO: backfill if necessary
    // update spotify playlist
    spotify.updatePlaylist(spotifyAuth.token, spotifyAuth.playlistId, trackUris);
}

// Spotify handlers
const handleGetCurrentlyPlaying = response => {
    // Update state if we get a good response
    if (response.status === 200 && response.data !== '') {
        state.is_playing = response.data.is_playing || false;
        state.progress_ms = response.data.progress_ms || 0;
        if (response.data.item !== null) {
            state.track = (spotify.extractTrack(response.data.item))
                ? spotify.extractTrack(response.data.item)
                : null;
            if (state.track !== null) {
                console.log(`Now playing: ${state.track.name}`);
                // Remove the track from the user's playlist to update state
                // The track is removed by trackUri so it will be removed
                // from all users who queued the song.
                station.removeTrack(users, state.track.uri);
            }
        }
    }
}

// on connection method
io.on("connection", socket => {

    console.log(`Client connected: ${socket.id}`);

    // Set active member count
    state.activeMemberCount = io.engine.clientsCount;

    // Initialize user
    const userId = socket.id;
    users[userId] = { playlist: [] }
    intervals[userId] = null;
    usersMap.push(userId);
    updateUsersNext();

    // Handle heartbeat
    intervals[userId] = setInterval(() => {
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
        console.log(`clearing playlist ${spotifyAuth.playlistId}`);
        spotify.updatePlaylist(spotifyAuth.token, spotifyAuth.playlistId);
        setTimeout(() => {
            console.log(`playling playlist`);
            spotify.playPlaylist(spotifyAuth.token, spotifyAuth.deviceId, spotifyAuth.playlistUri);
        }, 1000);
    });

    // Handle queue add
    socket.on("add song", track => {
        // add track to user's playlist
        users[userId].playlist.push(track);
        handleNewTracks();
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
        clearInterval(intervals[userId]);
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