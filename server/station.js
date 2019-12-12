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

        console.log(`checking userId: ${nextUserId}`);

        // break if all empty
        if (empty.length === Object.keys(users).length) {
            console.log("*** EMPTY ***");
            return false;
        }

        // see if userId has a track and return it
        if (users[nextUserId].playlist.length > 0) {
            // update the current user
            state.currentUserId = nextUserId;
            let track = users[nextUserId].playlist.shift();
            console.log(`~~~ Found Track, updated state.currentUserId: ${state.currentUserId}`);
            return track;
        } else {
            if (!empty.includes(nextUserId)) {
                console.log(`adding to empty: ${nextUserId}`)
                empty.push(nextUserId);
            }
            // move on to next user
            nextUserId = users[nextUserId].next;
        }

        return gnt(nextUserId, users, state, empty);
    }

    // If no users empty, return false
    if (Object.keys(users).length === 0) {
        console.log(`*** NO USERS ***`);
        return false;
    }

    // Pick initial user
    const nextUserId = state.currentUserId === null
        ? Object.keys(users)[0]
        : users[state.currentUserId].next;

    return gnt(nextUserId, users, state);

}