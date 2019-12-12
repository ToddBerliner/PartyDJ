'use strict';

const spotify = require("./spotify.js");

/*
    Flow is
    - client.emit(track) // client sends full track
    - server.users[userId].playlist.push(track) // next emit(stationState) updates client
    - updateSystemTracks() // creates backfill
    
    Playing the Station
    -- spotify.getCurrentlyPlaying()
    --- if (duration_ms === progress_ms) -> playNextSong() // TODO: develop w/ 500 for every song
    -- station.getNexttrack()
    --- starting with current playing user, loop users until we find next song
    ---- update current playing user
    ---- shift() song from users[userId].playlist to UI is updated
    ---- if ! user song, return next system song
    -- spotify.play(track)

    Validate above flow:
    - ensure connected client displays up next/queue correctly
    - set timeout for 3 seconds, playNextTrack() // shifts song from server.state.users.tracks
    - ensure connected client reflects playlist change 
*/

module.exports.getStationState = (user, state) => {
    if (typeof user === 'undefined') {
        return state;
    }
    // state = state + user.tracks
    const userSpecificState = Object.assign({}, state);
    userSpecificState.playlist = user.playlist;
    return userSpecificState;
}

module.exports.getNextTrack = (users, state) => {

    // Resursive function
    const gnt = (nextUserId, users, state, empty = []) => {
        // Fail safe return in case all users have disconnected
        if (empty.length === Object.keys(users).length) {
            return false;
        }

        // see if userId has a track and return it
        if (users[nextUserId].playlist.length > 0) {
            // Make this user the currentUserId since they're track
            // is being returned as the next track
            state.currentUserId = nextUserId;
            let track = users[nextUserId].playlist.shift();
            return track;
        } else {
            // Mark this user empty if not already marked
            if (!empty.includes(nextUserId)) {
                empty.push(nextUserId);
            }
            // Move on to next user
            nextUserId = users[nextUserId].next;
        }

        return gnt(nextUserId, users, state, empty);
    }

    // If no users empty, return false
    if (Object.keys(users).length === 0) {
        return false;
    }

    // Pick initial user and start recursion
    const nextUserId = state.currentUserId === null
        ? Object.keys(users)[0]
        : users[state.currentUserId].next;

    return gnt(nextUserId, users, state);

}