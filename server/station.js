'use strict';

const spotify = require("./spotify.js");

module.exports.calculatePlaylist = function () {

    /*
        Playlist UI in client is managed by the client state. We need the playlist URIs
        to populate the playlist in Spotify only. We can store the station playlist state
        as just and map of userId => trackUri to allow the "songs before" calc
        for each user.

        Flow is
        - client->emit(songId)
        - server.state.playlist = server->calculatePlaylist => {
            userId: track
        } // moves from state.users to state.playlist
        - spotify.updatePlaylist(trackUris)
        - spotify.getStationState()
        - spotify.emit(stationState) // user specific

        // shift() elements out of server.users to reduce array
        server.users = {
            userId: {trackUris: [trackUris...]}
        }
        // round robin user selected tracks into playlist
        server.playlist = [
            {userId: trackUri}
        ]
        // if songs remaining <= 5, calculate next 5 based on remaining 5
        
        // track playlistPosition by checking now playing song against index, incrementing
        // until match is found (this moves to calculate )
        server.playlistPosition = 3

        Calculate Station
        - roundRobin users
        - get recomendations based on seeds

        ALTERNATIVE
        - client.emit(track) // client sends full track
        - server.state.users[userId].playlist.push(track) // next emit(stationState) updates client
        - updateSystemSongs() // creates backfill
        
        Playing the Station
        -- spotify.getCurrentlyPlaying()
        --- if (duration_ms === progress_ms) -> playNextSong() // TODO: develop w/ 500 for every song
        -- playNextSong()
        --- starting with current playing user, loop users until we find next song
        ---- update current playing user
        ---- shift() song from users[userId].playlist to UI is updated
        ---- play song
        ---- if ! user song, play next system song

        Validate above flow:
        - hardcoded station state
        - ensure connected client displays up next/queue correctly
        - set timeout for 3 seconds, playNextSong() // shifts song from server.state.users.tracks
        - ensure connected client reflects playlist change 
    */
    const playlist = [];
    let tracksLeft = false;
    do {
        for (let user in users) {
            // grab last track from each user into seed

            // check for track and add to playlist
            let track = users[user].trackUris.shift();
            if (typeof track !== 'undefined') {
                playlist.push({ user: track });
            }
            // check if more to go
            tracksLeft = users[user].trackUris.length > 0;
        }
    } while (tracksLeft);
}

module.exports.getStationState = (user, state) => {
    if (typeof user === 'undefined') {
        return state;
    }
    // state = state + user.tracks
    const userSpecificState = Object.assign({}, state);
    userSpecificState.playlist = user.playlist;
    return userSpecificState;
}