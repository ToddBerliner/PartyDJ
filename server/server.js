'use strict';

// requires
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const spotify = require("./spotify.js");
const station = require("./station.js");
const user = require("./user.js");

const playlistData = require("./src/playlistData.js");

// configure server
const port = 4000;
const index = require("./routes/index"); // TODO: this is uneccesary

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
};
const users = {};
const intervals = {};
const usersMap = [];
const spotifyAuth = {
    token: null,
    deviceId: null,
    userId: null,
    playlistId: "40A1SdohDLvoG4iitBuqns",
    playlistUri: "spotify:playlist:40A1SdohDLvoG4iitBuqns",
    appToken: null
};

// Get Spotify app token
spotify.getAppToken(spotifyAuth, null);

// Spotify heartbeat
let spotifyHeartbeat = setInterval(() => {
    if (spotifyAuth.token !== null && spotifyAuth.deviceId !== null) {
        spotify.getCurrentlyPlaying(spotifyAuth.token, handleGetCurrentlyPlaying);
    }
}, 2000);

// App handlers
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
    // add backfill if necessary
    if (trackUris.length < 51) {
        console.log(">>> Getting recos");
        const trackIds = trackUris.map(trackUri => spotify.extractId(trackUri));
        spotify.getRecommendations(spotifyAuth.appToken, trackIds, (response) => {
            // Compile the final playlist with backfill
            if (response.status === 200
                && response.data
                && response.data.tracks) {
                for (let track of response.data.tracks) {
                    trackUris.push(track.uri);
                }
                console.log(`>>> GOT recos ${trackUris.length}`);
            }
            handleUpdatedPlaylist(trackUris);
        });
    } else {
        // Go ahead and update the playlist
        // console.log(`Already have encouhd: ${trackUris.length}`);
        handleUpdatedPlaylist(trackUris);
    }
}

const handleUpdatedPlaylist = (trackUris) => {
    console.log(">>> Got playlist to update in Spotify");
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
                // console.log(`Now playing: ${state.track.name}`);
                // Remove the track from the user's playlist to update state
                // The track is removed by trackUri so it will be removed
                // from all users who queued the song.
                station.removeTrack(users, state.track.uri);
            }
        }
    }
};

const handleSearchResults = (userId, response, type) => {
    try {
        switch (type) {
            case 'track':
                const tracks = [];
                for (let trackData of response.data.tracks.items) {
                    let _track = spotify.extractTrack(trackData);
                    if (_track) {
                        tracks.push(_track);
                    }
                }
                io.to(`${userId}`).emit("search", tracks);
                break;
            case 'artist':
                const artists = [];
                for (let artistData of response.data.artists.items) {
                    let _artist = spotify.extractArtist(artistData);
                    if (_artist) {
                        artists.push(_artist);
                    }
                }
                io.to(`${userId}`).emit("search", artists);
                break;
            case 'album':
                const albums = [];
                for (let albumData of response.data.albums.items) {
                    let _album = spotify.extractAlbum(albumData);
                    if (_album) {
                        albums.push(_album);
                    }
                }
                io.to(`${userId}`).emit("search", albums);
                break;
            default:
                console.log("No type provided");
        }
    } catch (err) {
        console.log("Error searching: ");
        console.log(err);
    }
};

const handleAlbums = (userId, response, event) => {
    if (response.status === 200) {
        const albums = [];
        try {
            for (let albumData of response.data.items) {
                let _album = spotify.extractAlbum(albumData);
                if (_album) {
                    albums.push(_album);
                }
                io.to(`${userId}`).emit(event, albums);
            }
        } catch (err) { console.log(err); }
    }
};

const handleTracks = (userId, response, event) => {
    /**
     * We have the album already, which includes the art. Now, the user
     * has drilled down to tracks. Extract and return the tracks.
     */
    if (response.status === 200) {
        const tracks = [];
        try {
            // Extract tracks
            let data = '';
            if (response.data.items) {
                data = response.data.items;
            }
            if (response.data.tracks) {
                data = response.data.tracks;
            }
            for (let trackData of data) {
                let _track = spotify.extractTrack(trackData);
                if (_track) {
                    tracks.push(_track);
                }
            }
            io.to(`${userId}`).emit(event, tracks);
        } catch (err) { console.log(err); }
    }
};

// on connection method
io.on("connection", socket => {

    console.log(`Client connected: ${socket.id}`);

    // Set active member count
    state.activeMemberCount = io.engine.clientsCount;

    // Initialize user
    const userId = socket.id;
    users[userId] = { playlist: [] };
    intervals[userId] = null;
    usersMap.push(userId);
    updateUsersNext();

    // Handle heartbeat
    intervals[userId] = setInterval(() => {
        // console.log(`--> emit to: ${userId}`);
        io.to(`${userId}`).emit("station state", station.getStationState(users[userId], state));
    }, 1000);

    socket.on("register", data => {
        user.getRefreshTokenByUserId(data.userId)
            .then(refreshToken => {
                console.log(`Got refresh token: ${refreshToken}`);
                // TODO: get token with refresh token
                io.to(`${userId}`).emit("token refresh", refreshToken);
            });
    });

    // Handle login
    socket.on("spotify login", data => {

        console.log("Old event - spotify login");
        return false;

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
    socket.on("remove song", index => {
        handleRemoveSong(socket.id, index);
    });

    // Handle search
    socket.on("search", search => {
        if (search.query && search.type) {
            console.log(`Recieved search: ${search.query} of type ${search.type}`);
            // Search - track
            const { query, type } = search;
            spotify.search(
                spotifyAuth,
                socket.id,
                search.query,
                search.type,
                handleSearchResults
            );
        }
    });
    // Handle Artist Top Tracks
    socket.on("artistTopTracks", artistUri => {
        spotify.fetchArtistTopTracks(
            spotifyAuth.appToken,
            socket.id,
            spotify.extractId(artistUri),
            handleTracks);
    });
    // Handle Artist Albums - not going to use this one - only top tracks for artist drill down
    // socket.on("artistAlbums", artistId => {
    //     spotify.fetchArtistAlbums(
    //         spotifyAuth.appToken,
    //         socket.id,
    //         artistId,
    //         handleAlbums);
    // });
    // Handle abum Tracks
    socket.on("albumTracks", albumUri => {
        spotify.fetchAlbumTracks(
            spotifyAuth.appToken,
            socket.id,
            spotify.extractId(albumUri),
            handleTracks);
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
        // Clear spotify heartbeat if there are no more users
        if (users.length === 0) {
            clearInterval(spotifyHeartbeat);
            state.track = null;
            console.log(`Cleared Spotify Heartbeat`);
        }
    });
});

// Listen up!
server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});