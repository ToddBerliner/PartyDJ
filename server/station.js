'use strict';

const spotify = require("./spotify.js");

/*
    Flow is
    - client.emit(track) // client sends full track
    - server.users[userId].playlist.push(track) // next emit(stationState) updates client
    - updateSystemTracks() // creates backfill
    
    Users holds user playlists as is
    updatePlaylist
    -- copy users
    -- build playlist (destructive to users copy)
    -- backfill if needed
    -- replace tracks in spotify
    getCurrentlyPlaying
    -- find track in users & delete it (will update user specific state)
    
    2nd step is to keep track of what's been played already
    For playlist, only replace tracks that haven't been played yet?
    Or just replace the whole thing - no history needed?
    User station state = user.playlist with played tracks filtered out

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